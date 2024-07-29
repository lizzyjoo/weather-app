class Daily{
    constructor(
        datetime,
        icon,
        temp,
        tempmin,
        tempmax,
        conditions
    ) {
        this.datetime = datetime;
        this.icon = icon;
        this.temp = temp;
        this.tempmin = tempmin;
        this.tempmax = tempmax;
        this.conditions = conditions;
    }
        
}

export default Daily;