from django.contrib.auth.models import User
from dishbook.models import Profile

USERS = [
    {
        "username": "alovelace",
        "password": "ada",
        "first_name": "Ada",
        "last_name": "Lovelace",
        "email": "ada@example.com",
        "bio": "Mathematician and first programmer."
    },
    {
        "username": "aturing",
        "password": "alan",
        "first_name": "Alan",
        "last_name": "Turing",
        "email": "alan@example.com",
        "bio": "Enjoys puzzles and breakfast foods."
    },
    {
        "username": "ghopper",
        "password": "grace",
        "first_name": "Grace",
        "last_name": "Hopper",
        "email": "grace@example.com",
        "bio": "Believes bugs should be removed, not admired."
    }
]

for info in USERS:
    user, created = User.objects.get_or_create(
        username=info["username"],
        defaults={
            "first_name": info["first_name"],
            "last_name": info["last_name"],
            "email": info["email"],
        },
    )

    changed = False
    if user.first_name != info["first_name"]:
        user.first_name = info["first_name"]
        changed = True
    if user.last_name != info["last_name"]:
        user.last_name = info["last_name"]
        changed = True
    if user.email != info["email"]:
        user.email = info["email"]
        changed = True

    # Always reset to known classroom passwords for predictable testing.
    user.set_password(info["password"])
    user.save()

    profile, _ = Profile.objects.get_or_create(user=user)
    if profile.bio != info["bio"]:
        profile.bio = info["bio"]
        profile.save()

    print(f"Ready: {info['username']} / {info['password']}")

print("Starter users created or refreshed.")
