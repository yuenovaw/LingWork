// 南京各区中心坐标（GCJ-02 火星坐标系）
const NANJING_DISTRICTS = [
  { name: '玄武区', lat: 32.073, lng: 118.812 },
  { name: '秦淮区', lat: 32.044, lng: 118.792 },
  { name: '建邺区', lat: 32.043, lng: 118.722 },
  { name: '鼓楼区', lat: 32.072, lng: 118.763 },
  { name: '雨花台区', lat: 31.991, lng: 118.791 },
  { name: '栖霞区', lat: 32.131, lng: 118.909 },
  { name: '江宁区', lat: 31.953, lng: 118.840 },
  { name: '浦口区', lat: 32.090, lng: 118.617 },
  { name: '六合区', lat: 32.337, lng: 118.821 },
  { name: '溧水区', lat: 31.654, lng: 119.028 },
  { name: '高淳区', lat: 31.328, lng: 118.892 },
];

const NJ_CENTER = { lat: 32.06, lng: 118.79 };
const NJ_RADIUS_KM = 80;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestDistrict(lat, lng) {
  let best = NANJING_DISTRICTS[0];
  let minDist = Infinity;
  for (const d of NANJING_DISTRICTS) {
    const dist = haversineKm(lat, lng, d.lat, d.lng);
    if (dist < minDist) { minDist = dist; best = d; }
  }
  return { name: `南京${best.name}`, distKm: minDist };
}

function isInNanjing(lat, lng) {
  return haversineKm(lat, lng, NJ_CENTER.lat, NJ_CENTER.lng) <= NJ_RADIUS_KM;
}

function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: res => resolve({ lat: res.latitude, lng: res.longitude }),
      fail: reject,
    });
  });
}

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)}米`;
  if (km < 10) return `${km.toFixed(1)}公里`;
  return `${Math.round(km)}公里`;
}

module.exports = { getLocation, nearestDistrict, isInNanjing, haversineKm, formatDist };
