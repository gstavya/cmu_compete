import React from 'react';
import Profile from '../components/Profile';

const ProfilePage = ({ user, currentAndrewID }) => {
  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "0 20px" }}>
      <Profile user={user} currentAndrewID={currentAndrewID} />
    </div>
  );
};

export default ProfilePage;
