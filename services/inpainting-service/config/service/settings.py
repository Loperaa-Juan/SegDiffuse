from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core
    service_name: str = "inpainting_service"
    host: str = "0.0.0.0"
    port: int = 8080
    log_level: str = "INFO"

    # Inference
    device: str = "cuda:0"
    model_path: str = "runwayml/stable-diffusion-inpainting"
    img_size: int = 512
    guidance_scale: float = 7.5
    num_inference_steps: int = 50
    default_prompt: str = ""


settings = Settings()
