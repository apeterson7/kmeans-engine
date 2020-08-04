const Vector = require('vector-object');

class Cluster {
  constructor(centroid) {
    this.centroid = centroid; //this is a vector

    this.init();
  }

  init() {
    this.hasMoved = false;
    this.dataIds = [];
    this.data = [];
  }

  addDatum(id, datum) {
    this.dataIds.push(id);
    this.data.push(datum);
  }

  calculateCentroids() {
    const newCentroid = new Vector();

    this.data.forEach((datum) => {
      newCentroid.add(datum.vector);
    });

    newCentroid.divide(this.data.length);

    if (!this.centroid.isEqual(newCentroid)) {
      this.centroid = newCentroid;
      this.hasMoved = true;
    }
  }
}

module.exports = Cluster;
