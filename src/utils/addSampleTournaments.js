import { createSampleTournaments } from './tournamentUtils';

// Function to add sample tournaments to the database
export const addSampleTournaments = async () => {
  try {
    console.log('Creating sample tournaments...');
    const result = await createSampleTournaments();
    
    if (result.success) {
      console.log('Sample tournaments created successfully!');
      alert('Sample tournaments have been added to the database!');
      return result;
    } else {
      console.error('Failed to create sample tournaments:', result.error);
      alert('Failed to create sample tournaments: ' + result.error);
      return result;
    }
  } catch (error) {
    console.error('Error adding sample tournaments:', error);
    alert('Error adding sample tournaments: ' + error.message);
    return { success: false, error: error.message };
  }
};

// Function to check if tournaments exist
export const checkTournamentsExist = async () => {
  try {
    const { db } = await import('../firebase');
    const { collection, getDocs } = await import('firebase/firestore');
    
    const tournamentsRef = collection(db, 'tournaments');
    const snapshot = await getDocs(tournamentsRef);
    
    return snapshot.size > 0;
  } catch (error) {
    console.error('Error checking tournaments:', error);
    return false;
  }
};
