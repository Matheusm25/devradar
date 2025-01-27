const axios = require('axios');
const Dev = require('../models/Dev');
const parseArrayAsString = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;

    let dev = await Dev.findOne({ github_username });
    
    if (!dev) {
      const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
      const { avatar_url, name = login, bio } = apiResponse.data;

      const techsArray = parseArrayAsString(techs);

      const location = {
        type: 'Point',
        coordinates: [
          longitude,
          latitude,
        ]
      };

      dev = await Dev.create({
        github_username,
        name,
        bio,
        avatar_url,
        techs: techsArray,
        location,
      })

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray,
      );

      sendMessage(sendSocketMessageTo, 'new-dev', dev);
    }

    response.json(dev);
  },

  async index(request, response) {
    const devs = await Dev.find();
    return response.json(devs);
  }
};