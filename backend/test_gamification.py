import os
import sys

from app.core.database import SessionLocal
from app.services.gamification_service import GamificationService
from app.models.user import User

db = SessionLocal()
try:
    svc = GamificationService(db)
    
    jane = db.query(User).filter(User.email == 'jane.smith@ecosphere.dev').first()
    
    if not jane:
        print('Could not find Jane Smith in database.')
        sys.exit(1)
        
    print(f'Found user: {jane.full_name} (XP: {jane.xp_points}, Level: {jane.level})')
    
    print('\nFetching challenges...')
    challenges = svc.repo.list_active_challenges()
    print(f'Available challenges: {len(challenges)}')
    if challenges:
        print(f'First challenge: {challenges[0].title}')
        
    print('\nFetching leaderboard...')
    leaderboard = svc.repo.get_leaderboard(limit=5)
    for entry in leaderboard:
        print(f"{entry['rank']}. {entry['full_name']} - {entry['xp_points']} XP (Level {entry['level']})")
        
    print('\nGamification engine check passed!')
    
finally:
    db.close()
