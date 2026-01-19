-- Insert Mock Tests
insert into tests (title, description, category_id, duration_minutes, difficulty) values
('Physics: Kinematics Mastery', 'Test your understanding of motion, velocity, and acceleration.', (select id from categories where slug = 'physics'), 30, 'Medium'),
('Calculus I: Limits & Derivatives', 'Fundamental concepts of limits and basic differentiation rules.', (select id from categories where slug = 'mathematics'), 45, 'Hard'),
('General Knowledge Quick Fire', 'A quick test to check your general awareness.', (select id from categories where slug = 'general'), 15, 'Easy');

-- Insert Questions for Physics Test (assuming ID 1 for simplicity in seed, but in real app we use returned IDs)
-- Note: In a real script we might need to handle IDs dynamically, but for a manual seed, we can assume auto-increment starts at 1 if table is empty.

-- Physics Questions
insert into questions (test_id, content, options, correct_option, marks) values
((select id from tests where title = 'Physics: Kinematics Mastery'), 'A car accelerates from 0 to 60 m/s in 5 seconds. What is its acceleration?', '["10 m/s²", "12 m/s²", "15 m/s²", "8 m/s²"]'::jsonb, 1, 4),
((select id from tests where title = 'Physics: Kinematics Mastery'), 'Which of the following is a vector quantity?', '["Speed", "Distance", "Velocity", "Mass"]'::jsonb, 2, 4),
((select id from tests where title = 'Physics: Kinematics Mastery'), 'If a ball is thrown upwards, what is its velocity at the highest point?', '["Maximum", "Zero", "9.8 m/s", "Cannot be determined"]'::jsonb, 1, 4);

-- Calculus Questions
insert into questions (test_id, content, options, correct_option, marks) values
((select id from tests where title = 'Calculus I: Limits & Derivatives'), 'What is the derivative of x^2?', '["x", "2x", "x^2", "2"]'::jsonb, 1, 4),
((select id from tests where title = 'Calculus I: Limits & Derivatives'), 'Limit of (1/x) as x approaches infinity is:', '["Infinity", "1", "0", "Undefined"]'::jsonb, 2, 4);
