from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core
    service_name: str = "inpainting_service"
    host: str = "0.0.0.0"
    port: int = 8080
    log_level: str = "INFO"

    # Inference
    device: str = "cuda:0"
    model_path: str = "black-forest-labs/FLUX.1-Fill-dev"
    img_width: int = 720
    img_height: int = 720
    guidance_scale: float = 30.0
    num_inference_steps: int = 20
    max_sequence_length: int = 512
    default_prompt: str = ""


settings = Settings()
