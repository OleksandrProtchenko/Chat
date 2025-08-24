from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from app.schemas.user import UserCreate, UserLogin, UserInDB, Token
from app.services import user_service
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserInDB)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Паролі повинні співпадати")
    existing_user = user_service.get_user_by_username_or_email(db, user.username) or \
                    user_service.get_user_by_username_or_email(db, user.email)
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Користувач з таким іменем або email вже існує")
    
    return user_service.create_user(db=db, user=user)

@router.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = user_service.get_user_by_username_or_email(db, data.login)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неправильне ім'я користувача або пароль")
    
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
    ):
    user = user_service.get_user_by_username_or_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неправильне ім'я користувача або пароль")

    access_token = create_access_token({"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}