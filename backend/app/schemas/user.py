from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=6)
    confirm_password: str
    gender: Literal["male", "female"]


class UserLogin(BaseModel):
    login: str
    password: str


class UserInDB(BaseModel):
    id: int
    username: str
    email: EmailStr
    gender: Literal["male", "female"]

    class Config:
        from_attributes = True


class UserMe(BaseModel):
    id: int
    username: str
    email: EmailStr
    gender: Literal["male", "female"]

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=30)
    gender: Optional[Literal["male", "female"]] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)
    confirm_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"