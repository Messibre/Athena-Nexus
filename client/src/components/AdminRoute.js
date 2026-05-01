import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAdmin, selectAuthLoading } from '../redux/selectors/authSelectors';
import LoadingScreen from './LoadingScreen';

const AdminRoute = ({ children }) => {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const loading = useSelector(selectAuthLoading);

  if (loading) {
    return (
      <LoadingScreen
        title="Checking admin access"
        message="Loading the admin workspace securely."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
