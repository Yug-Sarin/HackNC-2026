current_xp: int = 0

#Event class documentation below:

#Parts of Event class such as event_id was explained and assisted by PromptLab ChatGPT
#Date accessed: October 10, 2026

class Event:
    name: str
    difficulty: str = ""
    xp: int = 0
    duration: float
    event_id:int

    def __init__(self, name:str, event_id: int, duration: float):
        """Initialize the base function"""
        self.name = name
        self.duration = duration
        self.event_id = event_id

    def description(self):
        
        """Give a description of the event"""
        return (f"Event name: {self.name}\n"
                f"Event duration: {self.duration}\n"
                f"Difficulty: {self.calculate_difficulty()}\n"
                f"XP that you would gain from completing the event: {self.calculate_xp()}")

    def calculate_xp(self):
        """Calculate the XP gained from the event based on difficulty and duration"""
        if self.duration <= 1.0 and self.duration > 0.0:
            return 50
        elif self.duration <= 2.0 and self.duration > 1.0:
            return 100
        elif self.duration <= 3.0 and self.duration > 2.0:
            return 150
        else:
            return 200

        return self.xp

    def calculate_difficulty(self):
        """Calculate the difficulty of the event based on duration"""
        if self.duration <= 1.0 and self.duration > 0.0:
            self.difficulty = "easy"
        elif self.duration <= 2.0 and self.duration > 1.0:
            self.difficulty = "medium"
        elif self.duration <= 3.0 and self.duration > 2.0:
            self.difficulty = "hard"
        else:
            self.difficulty = "very hard"

        return self.difficulty
    

#Profile class documentation below:

#Profile class created with assistance and template from PromptLab ChatGPT
#Open AI, Accessed date: October 10, 2026

class Profile:
    username: str
    rsvped_events: list
    completed_events: list

    def __init__(self, username):
        self.username = username
        self.rsvped_events = []
        self.completed_events = []

    def rsvp_to_event(self, event):
        if event.event_id not in self.rsvped_events:
            self.rsvped_events.append(event.event_id)
            return f"{self.username} RSVP'd to {event.name}."
        else:
            return "You already RSVP'd to this event."

    def complete_event(self, event):
        if event.event_id not in self.rsvped_events:
            print("You must RSVP to this event first.")
            return

        elif event.event_id in self.completed_events:
            print("You have already completed this event.")
            return
        
        earned_xp = event.calculate_xp()
        global current_xp
        current_xp += earned_xp
        self.completed_events.append(event.event_id)
        return f"You earned {earned_xp} XP!"


#Test the 2 classes
new_event: Event = Event("Volunteering at Food Shelf",1, 2.0)
profile_one: Profile = Profile("John")
print(f"{profile_one.username} has {current_xp} XP.")
print()

print(new_event.description())

print()
profile_one.rsvp_to_event(new_event)
profile_one.complete_event(new_event)
print(f"{profile_one.username} has {current_xp} XP.")

another_event: Event = Event("Beach Cleanup",2, 3.5)
print()
print(another_event.description())
print()

profile_one.rsvp_to_event(another_event)
profile_one.complete_event(another_event)

print(f"{profile_one.username} has {current_xp} XP.")