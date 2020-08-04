const chai = require('chai');
const Vector = require('vector-object');
const Cluster = require('../lib/Cluster');

chai.should();

const data = require('../fixtures/2d-numbers');

describe('Cluster', () => {
  describe('calculateCentroids', () => {
    const vectors = data.map(obj => {
      return {datum: obj, vector: new Vector(obj)}
    });

    const cluster = new Cluster(new Vector());

    cluster.addDatum(0, vectors[0]);
    cluster.addDatum(1, vectors[1]);
    cluster.addDatum(2, vectors[2]);
    cluster.addDatum(3, vectors[3]);

    cluster.calculateCentroids(vectors);

    it('should be able to calculate centroids correctly', () => {
      cluster.centroid.toObject().should.to.deep.equal({ x: 1.75, y: 1.5 });
    });

    it('should be able to tell centroid has moved', () => {
      cluster.hasMoved.should.to.equal(true);
    });
  });
});
