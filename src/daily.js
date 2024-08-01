class Daily {
  constructor(datetime, icon, precipprob, temp, tempmin, tempmax, conditions) {
    this.datetime = datetime;
    this.icon = icon;
    this.temp = temp;
    this.precipprob = precipprob;
    this.tempmin = tempmin;
    this.tempmax = tempmax;
  }
}

export default Daily;
