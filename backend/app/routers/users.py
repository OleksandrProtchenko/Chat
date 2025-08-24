from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserMe, UserUpdate, PasswordChange
from app.core.security import verify_password
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserMe)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserMe)
def patch_me(
    payload: UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
    ):
    if payload.username and user_service.is_username_taken(db, payload.username, exclude_user_id=current_user.id):
        raise HTTPException(status_code=400, detail="Таке ім'я користувача вже зайняте")
    
    user = user_service.update_user(db, current_user, payload)
    return user

@router.post("/me/change-password")
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.old_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Невірний старий пароль")
    if body.new_password != body.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Нові паролі не співпадають")
    
    user_service.set_user_password(db, current_user, body.new_password)
    return {"message": "Пароль успішно змінено"}