
import { Context } from "../../main";
import { Navigate } from "react-router-dom";
import { useContext } from "react";

const Home = () => {
  const { isAuthenticated } = useContext(Context);
  if (!isAuthenticated) {
    return <Navigate to={"/auth"} />;
  }

  // Redirect authenticated users to dashboard
  return <Navigate to={"/dashboard"} />;
};

export default Home;
