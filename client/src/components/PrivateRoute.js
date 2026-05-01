import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthLoading } from '../redux/selectors/authSelectors';
import LoadingScreen from './LoadingScreen';

const PrivateRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  if (loading) {
    return (
      <LoadingScreen
        title="Checking access"
        message="Verifying your session before the protected screen loads."
      />
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
