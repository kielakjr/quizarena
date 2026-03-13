import { Link } from "react-router"

const Landing = () => {
  return (
    <main>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </main>
  )
}

export default Landing
