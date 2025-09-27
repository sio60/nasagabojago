// NASA API 서비스

const axios = require('axios');

class NasaApiService {
  constructor() {
    this.baseURL = process.env.NASA_BASE_URL || 'https://api.nasa.gov';
    this.apiKey = process.env.NASA_API_KEY;
  }

  // 1. ISS 현재 위치 조회
  async getCurrentIssPosition() {
    try {
      const response = await axios.get(`${this.baseURL}/iss-now.json`, {
        params: {
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: {
          latitude: parseFloat(response.data.iss_position.latitude),
          longitude: parseFloat(response.data.iss_position.longitude),
          timestamp: response.data.timestamp,
          message: response.data.message
        }
      };
    } catch (error) {
      console.error('ISS 위치 조회 실패:', error.message);
      return {
        success: false,
        message: 'ISS 위치 조회에 실패했습니다.'
      };
    }
  }

  // 2. 지구 이미지 조회
  async getEarthImages(count = 5) {
    try {
      const response = await axios.get(`${this.baseURL}/planetary/earth/imagery`, {
        params: {
          lat: 0,
          lon: 0,
          dim: 0.15,
          date: new Date().toISOString().split('T')[0],
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: {
          url: response.data.url,
          date: response.data.date,
          explanation: response.data.explanation
        }
      };
    } catch (error) {
      console.error('지구 이미지 조회 실패:', error.message);
      return {
        success: false,
        message: '지구 이미지 조회에 실패했습니다.'
      };
    }
  }

  // 3. NASA 사진 오브 더 데이
  async getAstronomyPictureOfTheDay() {
    try {
      const response = await axios.get(`${this.baseURL}/planetary/apod`, {
        params: {
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: {
          title: response.data.title,
          explanation: response.data.explanation,
          url: response.data.url,
          hdurl: response.data.hdurl,
          date: response.data.date,
          media_type: response.data.media_type
        }
      };
    } catch (error) {
      console.error('NASA 사진 조회 실패:', error.message);
      return {
        success: false,
        message: 'NASA 사진 조회에 실패했습니다.'
      };
    }
  }

  // 4. 지구 관측 데이터 (특정 위치)
  async getEarthObservationData(lat, lon, date) {
    try {
      const response = await axios.get(`${this.baseURL}/planetary/earth/imagery`, {
        params: {
          lat: lat,
          lon: lon,
          dim: 0.15,
          date: date || new Date().toISOString().split('T')[0],
          api_key: this.apiKey
        }
      });

      return {
        success: true,
        data: {
          url: response.data.url,
          date: response.data.date,
          lat: lat,
          lon: lon
        }
      };
    } catch (error) {
      console.error('지구 관측 데이터 조회 실패:', error.message);
      return {
        success: false,
        message: '지구 관측 데이터 조회에 실패했습니다.'
      };
    }
  }
}

module.exports = new NasaApiService();