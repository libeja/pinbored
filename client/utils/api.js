import axios from 'axios';

export default {
  submitPin: (imageUrl) => {
    return axios.post('/api/submitpin', {
      imageUrl
    });
  },
  checkIfLoggedIn: () => {
    return axios('/api/isuserauthenticated')
      .then(({ data }) => {
        if (data.authStatus === true) {
          return true;
        }
        return false;
      });
  },
  getAllPins() {
    axios('/api/allpins')
      .then(({ data }) => {
        this.setState({ allPins: data.allPins });
      });
  },
  deletePin(pinId) {
    return axios.delete(`/api/deletepin/${pinId}`)
      .then((response) => {
        return response.data;
      });
  },
  getUsersTwitterId() {
    axios('/api/getmyid')
      .then(({ data }) => {
        console.log(data.twitterId);
        this.setState({ twitterId: data.twitterId });
      });
  }
}