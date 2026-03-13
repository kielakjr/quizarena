import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

const mockQuizzes = [
  { id: '1', title: 'JavaScript Basics', questions: 10, plays: 42, pin: '384921', live: true },
  { id: '2', title: 'React Hooks Deep Dive', questions: 8, plays: 27, pin: '712034', live: false },
  { id: '3', title: 'CSS Grid Challenge', questions: 12, plays: 15, pin: '590167', live: false },
];

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="text-accent">{user?.username}</span>
          </h1>
          <p className="text-text-muted mt-1">Manage your quizzes and host games</p>
        </div>
        <Link
          to="/create"
          className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + Create quiz
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Quizzes created', value: '3', color: 'text-primary' },
          { label: 'Total players', value: '84', color: 'text-secondary' },
          { label: 'Games hosted', value: '12', color: 'text-accent' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-1"
          >
            <span className="text-text-muted text-sm">{stat.label}</span>
            <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Your quizzes</h2>
        <div className="flex flex-col gap-3">
          {mockQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{quiz.title}</h3>
                  {quiz.live && (
                    <span className="text-[10px] bg-correct/15 text-correct font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Live</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span>{quiz.questions} questions</span>
                  <span>{quiz.plays} plays</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-background border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs text-text-muted">PIN</span>
                  <span className="font-mono font-bold text-accent tracking-widest">{quiz.pin}</span>
                </div>

                <Link
                  to={`/host/${quiz.id}`}
                  className="text-sm bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-1.5 rounded-lg transition"
                >
                  {quiz.live ? 'Manage' : 'Start'}
                </Link>
                <button className="text-sm border border-border text-text-muted hover:text-text px-3 py-1.5 rounded-lg transition cursor-pointer">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
