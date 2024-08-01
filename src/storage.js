class Storage {
  static saveLocation(location) {
    localStorage.setItem("location", JSON.stringify(location));
  }

  static loadLocation() {
    return JSON.parse(localStorage.getItem("location")) || null;
  }

  static getLocation() {
    return this.loadLocation();
  }

  static updateLocation(newLocation) {
    this.saveLocation(newLocation);
  }
}

export default Storage;
