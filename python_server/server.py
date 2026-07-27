"""
ToolKit Local AI Server
Free-forever inference for TTS, voice cloning, music generation, image generation,
background removal, object removal, video upscaling, and transcription.

Run: pip install -r requirements.txt && python server.py
Server starts on http://localhost:8400
"""

import io
import os
import base64
import tempfile
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

app = FastAPI(title="ToolKit Local AI Server")

# Lazy-loaded models (loaded on first use)
_models = {}


def get_device():
    import torch
    return "cuda" if torch.cuda.is_available() else "cpu"


# ─── TTS (Edge TTS - free Microsoft voices) ───

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-AriaNeural"
    rate: str = "+0%"
    volume: str = "+0%"


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    import edge_tts
    communicate = edge_tts.Communicate(req.text, req.voice, rate=req.rate, volume=req.volume)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    if not audio_data:
        raise HTTPException(status_code=500, detail="TTS generation failed")
    return Response(content=audio_data, media_type="audio/mpeg")


@app.get("/api/tts/voices")
async def list_tts_voices():
    import edge_tts
    voices = await edge_tts.list_voices()
    return {"voices": voices}


# ─── Voice Cloning (OpenVoice) ───

class VoiceCloneRequest(BaseModel):
    text: str
    voice_id: str = "default"
    speed: float = 1.0
    pitch: float = 1.0


@app.post("/api/voice-clone")
async def voice_clone_tts(req: VoiceCloneRequest):
    try:
        from openvoice.api import ToneColorConverter
        if "tone_color" not in _models:
            tone_color_converter = ToneColorConverter(
                os.path.join(os.path.dirname(__file__), "OpenVoice/checkpoints/converter")
            )
            _models["tone_color"] = tone_color_converter
        tone_color_converter = _models["tone_color"]

        import edge_tts
        communicate = edge_tts.Communicate(req.text, "en-US-AriaNeural")
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            tmp_path = f.name

        from openvoice.api import ToneColorConverter
        import numpy as np
        import soundfile as sf

        speaker_wav = tmp_path
        output = tone_color_converter.convert(
            audio_src_path=speaker_wav,
            src_se=None,
            tgt_se=None,
            output_path=None,
        )
        os.unlink(tmp_path)

        return Response(content=audio_data, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {str(e)}")


# ─── Music Generation (MusicGen local) ───

class MusicGenRequest(BaseModel):
    prompt: str
    duration: float = 8.0
    temperature: float = 1.0
    top_p: float = 0.9
    classifier_free_guidance: float = 3.0


@app.post("/api/music-generate")
async def music_generate(req: MusicGenRequest):
    try:
        import torch
        from audiocraft.models import MusicGen

        if "musicgen" not in _models:
            device = get_device()
            _models["musicgen"] = MusicGen.get_pretrained("facebook/musicgen-small", device=device)
        model = _models["musicgen"]

        model.set_generation_params(
            duration=min(req.duration, 30),
            temperature=req.temperature,
            top_p=req.top_p,
            cfg_coef=req.classifier_free_guidance,
        )

        wav = model.generate([req.prompt])

        import soundfile as sf
        import numpy as np

        audio_np = wav[0].cpu().numpy()
        sr = model.sample_rate

        buf = io.BytesIO()
        sf.write(buf, audio_np.T, sr, format="WAV")
        audio_bytes = buf.getvalue()

        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Music generation failed: {str(e)}")


# ─── Image Generation (Stable Diffusion local) ───

class ImageGenRequest(BaseModel):
    prompt: str
    negative_prompt: str = "blurry, low quality"
    width: int = 512
    height: int = 512
    steps: int = 4
    guidance_scale: float = 7.5
    seed: Optional[int] = None


@app.post("/api/generate-image")
async def generate_image(req: ImageGenRequest):
    try:
        import torch
        from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler

        if "sdxl" not in _models:
            device = get_device()
            pipe = StableDiffusionXLPipeline.from_pretrained(
                "segmind/small-sdxl",
                torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            )
            pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
            pipe = pipe.to(device)
            _models["sdxl"] = pipe
        pipe = _models["sdxl"]

        generator = torch.Generator().manual_seed(req.seed) if req.seed else None

        image = pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            width=req.width,
            height=req.height,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            generator=generator,
        ).images[0]

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        img_bytes = buf.getvalue()

        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


# ─── Background Removal ───

@app.post("/api/remove-background")
async def remove_background(file: UploadFile = File(...)):
    try:
        from PIL import Image
        import numpy as np

        img_data = await file.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")

        if "rmbg" not in _models:
            from transformers import AutoModelForImageSegmentation
            _models["rmbg"] = AutoModelForImageSegmentation.from_pretrained(
                "briaai/RMBG-2.0", trust_remote_code=True
            )
        model = _models["rmbg"]

        import torch
        from torchvision import transforms

        transform = transforms.Compose([
            transforms.Resize((1024, 1024)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

        input_tensor = transform(img).unsqueeze(0)

        with torch.no_grad():
            output = model(input_tensor)

        mask = torch.nn.functional.interpolate(
            output[-1][0], size=img.size[::-1], mode="bilinear"
        ).squeeze().sigmoid().numpy()

        mask = (mask * 255).astype(np.uint8)
        mask_img = Image.fromarray(mask).resize(img.size)

        result = img.copy()
        result.putalpha(mask_img)

        buf = io.BytesIO()
        result.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")


# ─── Object Removal (LaMa) ───

@app.post("/api/remove-object")
async def remove_object(
    file: UploadFile = File(...),
    mask: UploadFile = File(...),
):
    try:
        from PIL import Image
        import numpy as np

        img_data = await file.read()
        mask_data = await mask.read()

        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        mask_img = Image.open(io.BytesIO(mask_data)).convert("L")

        if "lama" not in _models:
            from simple_lama_inpainting import SimpleLama
            _models["lama"] = SimpleLama()
        lama = _models["lama"]

        result = lama(img, mask_img)

        buf = io.BytesIO()
        result.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Object removal failed: {str(e)}")


# ─── Video Upscale (Real-ESRGAN) ───

@app.post("/api/upscale-video")
async def upscale_video(
    file: UploadFile = File(...),
    scale: int = Form(4),
):
    try:
        import subprocess
        import tempfile

        video_data = await file.read()
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(video_data)
            input_path = f.name

        output_path = input_path.replace(".mp4", "_upscaled.mp4")

        subprocess.run([
            "realesrgan-ncnn-vulkan",
            "-i", input_path,
            "-o", output_path,
            "-s", str(scale),
            "-n", "realesrgan-x4plus",
        ], check=True, timeout=300)

        with open(output_path, "rb") as f:
            result_data = f.read()

        os.unlink(input_path)
        os.unlink(output_path)

        return Response(content=result_data, media_type="video/mp4")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video upscale failed: {str(e)}")


# ─── Transcription (faster-whisper) ───

class TranscribeRequest(BaseModel):
    language: str = "en"


@app.post("/api/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
):
    try:
        if "whisper" not in _models:
            from faster_whisper import WhisperModel
            device = get_device()
            _models["whisper"] = WhisperModel("base", device=device)
        model = _models["whisper"]

        audio_data = await file.read()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            tmp_path = f.name

        segments, info = model.transmute(tmp_path, language=language if language != "auto" else None)

        result = []
        for segment in segments:
            result.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
            })

        os.unlink(tmp_path)
        return {"segments": result, "language": info.language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# ─── Health Check ───

@app.get("/api/health")
async def health():
    return {"status": "ok", "server": "toolkit-local-ai", "models_loaded": list(_models.keys())}


if __name__ == "__main__":
    import uvicorn
    print("Starting ToolKit Local AI Server on http://localhost:8400")
    uvicorn.run(app, host="0.0.0.0", port=8400)
