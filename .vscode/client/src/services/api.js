import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const fetchQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}/questions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

export const submitAnswer = async (answerData) => {
  try {
    const response = await axios.post(`${API_URL}/users/submit-answer`, answerData);
    return response.data;
  } catch (error) {
    console.error('Error submitting answer:', error);
    return { success: false, score: 0 };
  }
};
