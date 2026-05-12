from __future__ import annotations

import logging
import time

import torch
from config.service.settings import settings
from diffusers import FluxFillPipeline
from PIL import Image
from torchao.quantization import float8_dynamic_activation_float8_weight, quantize_

from src.models import InpaintingResult

logger = logging.getLogger(__name__)


class InpaintingEngine:
    def __init__(self) -> None:
        logger.info("Initializing InpaintingEngine")
        logger.info("Loading model: %s", settings.model_path)

        device = settings.device if torch.cuda.is_available() else "cpu"
        if device != settings.device:
            logger.warning(
                "CUDA not available, falling back to CPU (requested: %s)",
                settings.device,
            )

        logger.info("Device: %s | dtype: bfloat16", device)

        t0 = time.perf_counter()
        self._pipe = FluxFillPipeline.from_pretrained(
            settings.model_path,
            torch_dtype=torch.bfloat16,
        ).to(device)

        logger.info("Pipeline ready in %.2fs", time.perf_counter() - t0)

        quantize_(self._pipe.transformer, float8_dynamic_activation_float8_weight())
        logger.info("Transformer quantized to fp8 (dynamic activation + weight)")

        # Compile the transformer for faster repeated inference (CUDA graphs).
        # The first request will be slow (~2-5 min) while the kernel is compiled;
        # every subsequent request benefits from the cached compiled graph.
        self._pipe.transformer = torch.compile(
            self._pipe.transformer,
            mode="reduce-overhead",
            fullgraph=True,
        )
        logger.info("Transformer compiled with torch.compile (reduce-overhead)")

        self._device = device

    def predict(
        self, image: Image.Image, mask: Image.Image, prompt: str
    ) -> InpaintingResult:
        original_size = image.size

        size = (settings.img_width, settings.img_height)
        image_resized = image.resize(size)
        mask_resized = mask.resize(size)

        output = self._pipe(
            prompt=prompt,
            image=image_resized,
            mask_image=mask_resized,
            height=settings.img_height,
            width=settings.img_width,
            guidance_scale=settings.guidance_scale,
            num_inference_steps=settings.num_inference_steps,
            max_sequence_length=settings.max_sequence_length,
            generator=torch.Generator("cpu").manual_seed(0),
        ).images[0]

        final = output.resize(original_size)
        return InpaintingResult(image=final)
