import mongoose from 'mongoose';
import { env } from './config/env';
import { User } from './models/User';
import { Quiz } from './models/Quiz';

const users = [
  { username: 'quizmaster', email: 'quizmaster@example.com', password: 'password123' },
  { username: 'alice', email: 'alice@example.com', password: 'password123' },
  { username: 'bob', email: 'bob@example.com', password: 'password123' },
];

function q(text: string, options: [string, string, string, string], correctIndex: number, timeLimit = 20, points = 1000) {
  return {
    text,
    options: options.map((t, i) => ({ text: t, isCorrect: i === correctIndex })),
    timeLimit,
    points,
  };
}

const quizzes = [
  {
    title: 'World Geography',
    description: 'Test your knowledge of countries, capitals, and landmarks around the world.',
    isPublic: true,
    ownerIndex: 0,
    questions: [
      q('What is the capital of Japan?', ['Seoul', 'Tokyo', 'Beijing', 'Bangkok'], 1),
      q('Which continent is the Sahara Desert located on?', ['Asia', 'South America', 'Africa', 'Australia'], 2),
      q('What is the longest river in the world?', ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], 1),
      q('Which country has the most population?', ['USA', 'Indonesia', 'India', 'China'], 2),
      q('What is the smallest country in the world?', ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], 1, 15),
    ],
  },
  {
    title: 'Science Basics',
    description: 'From atoms to galaxies — how well do you know basic science?',
    isPublic: true,
    ownerIndex: 0,
    questions: [
      q('What planet is known as the Red Planet?', ['Venus', 'Jupiter', 'Mars', 'Saturn'], 2),
      q('What gas do plants absorb from the atmosphere?', ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'], 1),
      q('What is the chemical symbol for water?', ['HO', 'H2O', 'O2H', 'OH2'], 1, 10),
      q('How many bones are in the adult human body?', ['186', 'Over 300', '206', '256'], 2),
      q('What force keeps us on the ground?', ['Magnetism', 'Friction', 'Gravity', 'Inertia'], 2),
      q('What is the speed of light approximately?', ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '30,000 km/s'], 0, 15, 1500),
    ],
  },
  {
    title: 'Pop Culture Trivia',
    description: 'Movies, music, and memes — show off your pop culture knowledge!',
    isPublic: true,
    ownerIndex: 1,
    questions: [
      q('Who directed the movie "Inception"?', ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'Martin Scorsese'], 1),
      q('Which band released "Bohemian Rhapsody"?', ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], 2),
      q('What year was the first iPhone released?', ['2005', '2006', '2007', '2008'], 2, 15),
      q('Which TV show features a character named Walter White?', ['The Sopranos', 'Breaking Bad', 'Better Call Saul', 'Ozark'], 1),
      q('What is the highest-grossing film of all time?', ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: The Force Awakens'], 1, 20, 1500),
    ],
  },
  {
    title: 'Programming & Tech',
    description: 'A quiz for developers and tech enthusiasts.',
    isPublic: true,
    ownerIndex: 1,
    questions: [
      q('What does HTML stand for?', ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], 0, 15),
      q('Which language is primarily used for iOS development?', ['Java', 'Kotlin', 'Swift', 'C#'], 2),
      q('What does CSS stand for?', ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], 1, 10),
      q('What is the time complexity of binary search?', ['O(n)', 'O(n log n)', 'O(log n)', 'O(1)'], 2, 25, 1500),
      q('Which company developed TypeScript?', ['Google', 'Facebook', 'Apple', 'Microsoft'], 3),
      q('What does API stand for?', ['Application Programming Interface', 'Advanced Program Integration', 'Application Process Integration', 'Advanced Programming Interface'], 0, 15),
      q('What is the default port for HTTP?', ['443', '8080', '80', '3000'], 2, 10),
    ],
  },
  {
    title: 'History Highlights',
    description: 'Journey through time with these history questions.',
    isPublic: true,
    ownerIndex: 2,
    questions: [
      q('In what year did World War II end?', ['1943', '1944', '1945', '1946'], 2),
      q('Who was the first person to walk on the moon?', ['Buzz Aldrin', 'Neil Armstrong', 'Yuri Gagarin', 'John Glenn'], 1),
      q('Which ancient civilization built the pyramids at Giza?', ['Roman', 'Greek', 'Mayan', 'Egyptian'], 3),
      q('What year did the Berlin Wall fall?', ['1987', '1988', '1989', '1990'], 2, 15),
      q('Who painted the Mona Lisa?', ['Michelangelo', 'Raphael', 'Donatello', 'Leonardo da Vinci'], 3, 10),
    ],
  },
  {
    title: 'Sports Mania',
    description: 'How well do you know the world of sports?',
    isPublic: false,
    ownerIndex: 2,
    questions: [
      q('How many players are on a standard soccer team on the field?', ['9', '10', '11', '12'], 2, 10),
      q('In which sport is the term "love" used for a score of zero?', ['Badminton', 'Tennis', 'Table Tennis', 'Squash'], 1),
      q('Which country won the 2022 FIFA World Cup?', ['France', 'Brazil', 'Argentina', 'Germany'], 2),
      q('How long is an Olympic swimming pool?', ['25 meters', '50 meters', '75 meters', '100 meters'], 1, 15),
      q('Which sport uses a shuttlecock?', ['Tennis', 'Volleyball', 'Badminton', 'Squash'], 2),
      q('What is the diameter of a basketball hoop in inches?', ['16', '18', '20', '22'], 1, 20, 1500),
    ],
  },
];

async function seed() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB');

  await Quiz.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared existing data');

  const createdUsers = await User.create(users);
  console.log(`Created ${createdUsers.length} users`);

  const quizDocs = quizzes.map(({ ownerIndex, ...rest }) => ({
    ...rest,
    creator: createdUsers[ownerIndex]._id,
  }));

  const createdQuizzes = await Quiz.create(quizDocs);
  console.log(`Created ${createdQuizzes.length} quizzes`);

  console.log('\n--- Seed complete ---');
  console.log('\nLogin credentials (all passwords: password123):');
  for (const u of users) {
    console.log(`  ${u.email} (${u.username})`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
