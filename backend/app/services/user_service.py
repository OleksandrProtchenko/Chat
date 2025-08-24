from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_user_by_username_or_email(db: Session, login: str):
    return db.query(User).filter(
        (User.username == login) | (User.email == login)
    ).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        gender=user.gender
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def is_username_taken(db: Session, username: str, exclude_user_id: int | None = None) -> bool:
    q = db.query(User).filter(User.username == username)
    if exclude_user_id is not None:
        q = q.filter(User.id != exclude_user_id)
    return db.query(q.exists()).scalar()

def update_user(db: Session, user: User, data: UserUpdate) -> User:
    if data.username is not None:
        user.username = data.username
    if data.gender is not None:
        user.gender = data.gender
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def set_user_password(db: Session, user: User, new_password: str) -> User:
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def search_users(db: Session, query: str, exclude_user_id: int) -> list[User]:
    q = db.query(User).filter(
        (User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%"))
    ).filter(User.id != exclude_user_id)
    return q.limit(20).all()