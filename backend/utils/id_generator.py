import random
import string

def generate_gigtrust_id() -> str:
    part1 = "".join(random.choices(string.ascii_uppercase, k=3))
    part2 = "".join(random.choices(string.digits, k=4))
    part3 = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    part4 = random.choice(string.ascii_uppercase)
    return f"GT-{part1}-{part2}-{part3}-{part4}"
