from pydantic import BaseModel, Field


class SuggestQuestionsRequest(BaseModel):
    sourceIds: list[int] = []
    count: int = Field(default=4, ge=1, le=10)


class SuggestQuestionsResponse(BaseModel):
    questions: list[str]
    sourceIds: list[int]
