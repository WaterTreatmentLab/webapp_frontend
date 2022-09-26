import axios from 'axios';

const baseUrl = 'http://localhost:8000';
const workstation = 'testworkstation';

export const addTask = async (action: string, target: any, value: number) => {
  console.log({
    action: action,
    target: target,
    value: value,
    // conditions: {},
  });
  return await axios
    .post(`${baseUrl}/task/${workstation}`, {
      action: action,
      target: target,
      value: value,
      // conditions: {},
    })
    .then(res => {
      return res.status;
    })
    .catch(error => {
      return error.response.status;
    });
};