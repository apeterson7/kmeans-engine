const kmeans = require('../');
const engineers = require('../fixtures/engineers');

kmeans.clusterize(engineers, { k: 4, maxIterations: 10, debug: true }, (err, res) => {
  console.log('----- Results -----');
  console.log(`Iterations: ${res.iterations}`);
  console.log('Clusters: ');
  // console.log(res.clusters);
  res.clusters.forEach(element => {
    console.log(element.centroid);
    console.log(element.dataIds);
    element.data.forEach(datum => {
      console.log(datum);
    });
  });
});
