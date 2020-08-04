const _ = require('underscore');
const Vector = require('vector-object');
const Cluster = require('./Cluster');

class KMeansEngine {
  constructor(data, options, callback) {
    this.data = data;
    this.options = options;
    this.k = this.options.k;
    this.vectorLocator = this.options.vectorLocator; //a callback to find
    this.debug = this.options.debug || false;
    this.maxIterations = this.options.maxIterations;
    this.initialCentroids = this.options.initialCentroids;
    this.callback = callback;

    this.validateInput();
    this.init();
  }

  validateInput() {
    this.showLog('Validating inputs...');

    // data should be array of objects
    for (let i = 0; i < this.data.length; i += 1) {
      const v = this.data[i];

      if (!(_.isObject(v) && !_.isArray(v) && !_.isFunction(v))) {
        throw new Error('Data should be array of objects');
      }
    }

    // Cluster size should be a positive integer
    if (!_.isNumber(this.k) || !Number.isInteger(this.k) || this.k <= 0) {
      throw new Error('Cluster size should be a positive integer');
    }

    // Cluster size should be smaller than the vector size
    if (this.k > this.data.length) {
      throw new Error('Cluster size should be smaller than the vector size');
    }

    if ((this.maxIterations !== undefined) &&
        (!Number.isInteger(this.maxIterations) || (this.maxIterations <= 0))) {
      throw new Error('Max iterations should be a positive integer');
    }

    if (this.initialCentroids !== undefined) {
      if (!_.isArray(this.initialCentroids) || (this.initialCentroids.length !== this.k)) {
        throw new Error('Initial centroids should be array of length equal to cluster size');
      } else {
        // Initial centroids  should be array of objects
        for (let i = 0; i < this.initialCentroids.length; i += 1) {
          const c = this.initialCentroids[i];

          if (!_.isObject(c) || _.isArray(c) || _.isFunction(c)) {
            throw new Error('Centroids should be array of objects');
          }
        }
      }
    }
  }

  init() {
    this.showLog('Initializing kmeans engine...');

    this.iterations = 0;
    this.clusters = [];

    // map to original datum and vector object 
    //datum contains original object, vector contains 
    // console.log(this.vectorLocator == null ? 'this.vectorLocator == null ':'this.vectorLocator != null ');
    this.data = this.data.map(datum => {return {datum: datum, vector: this.vectorLocator == null ? new Vector(datum) : new Vector(this.vectorLocator(datum))}});

    if (this.initialCentroids === undefined) {
      const randNums = KMeansEngine.getRandomSequence(0, this.data.length - 1, this.k);
      // randomly pick a vector to be the centroid
      for (let i = 0; i < this.k; i += 1) {
        this.clusters.push(new Cluster(this.data[randNums[i]].vector)); //altered
      }
    } else {
      // set things up with the initial centroids
      for (let i = 0; i < this.k; i += 1) {
        this.clusters.push(new Cluster(new Vector(this.initialCentroids[i])));
      }
    }

    this.showLog(`Number of data: ${this.data.length}`);
    this.showLog(`Cluster size (k): ${this.k}`);
    this.showLog(`Max iterations: ${this.maxIterations ? this.maxIterations : 'No limit'}`);
  }

  static getRandomSequence(min, max, size) {
    // generate a sequence of non-repeat numbers in the range of 0 to vector.length - 1
    const randNums = [];

    while (randNums.length < size) {
      const r = Math.floor((Math.random() * ((max - min) + 1)) + min);

      if (randNums.indexOf(r) === -1) {
        randNums.push(r);
      }
    }

    return randNums;
  }

  showLog(message) {
    if (this.debug) console.log(message);
  }

  getResult() {
    return {
      iterations: this.iterations,
      clusters: this.clusters.map((cluster) => {
        const c = _.pick(cluster, 'centroid', 'dataIds','data');
        c.centroid = c.centroid.toObject();
        c.data = c.data.map(datum => datum.datum);

        return c;
      }),
    };
  }

  clusterize() {
    const self = this;

    function iterate() {
      self.showLog(`Iteration ${self.iterations} started...`);

      let hasMoved = false;

      // reset clusters
      for (let i = 0; i < self.clusters.length; i += 1) {
        self.clusters[i].init();
      }

      // for each vector, check which centroid is closest
      // then assign the vector to the cluster
      for (let i = 0; i < self.data.length; i += 1) {
        const datum = self.data[i];

        let min = Number.MAX_SAFE_INTEGER;
        let clusterIndex = 0;

        for (let j = 0; j < self.clusters.length; j += 1) {
          const { centroid } = self.clusters[j];

          const distance = datum.vector.getDistance(centroid);

          if (distance < min) {
            min = distance;
            clusterIndex = j;
          }
        }

        self.showLog(`Assigned vector ${i} to centroid ${clusterIndex}`);

        self.clusters[clusterIndex].addDatum(i, datum);
      }

      // re-calculate the centroids
      for (let i = 0; i < self.clusters.length; i += 1) {
        self.clusters[i].calculateCentroids();

        // check if any centroid hasMoved
        if (self.clusters[i].hasMoved) {
          hasMoved = true;

          self.showLog(`Calculating centroid ${i}, and it has moved`);
        } else {
          self.showLog(`Calculating centroid ${i}, and it has not moved`);
        }
      }

      self.showLog(`Iteration ${self.iterations} ended...`);

      self.iterations += 1;

      if (!hasMoved) {
        self.showLog('Iteration done as all centroids have not moved');

        return self.callback(null, self.getResult());
      } else if (self.maxIterations && self.iterations >= self.maxIterations) {
        self.showLog('Max iterations has been reached. Stop further iterations');

        return self.callback(null, self.getResult());
      }

      return process.nextTick(iterate);
    }

    return iterate();
  }
}

exports.clusterize = (data, options, callback) => {
  const kmeans = new KMeansEngine(data, options, callback);
  return kmeans.clusterize();
};
