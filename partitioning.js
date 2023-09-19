// const partition = (arr, fn) =>
//   arr.reduce(
//     (acc, val, i, arr) => {
//       acc[fn(val, i, arr) ? 0 : 1].push(val);
//       return acc;
//     },
//     [[], []]
//   );
// const users = [
//   { user: 'barney', age: 36, active: false },
//   { user: 'fred', age: 40, active: true },
// ];
// partition(users, o => o).map(item => {
//     console.log(item);
// })


// var a = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// function partition(items, size) {
//   var result = _.groupBy(items, function(item, i) {
//     return Math.floor(i / size);
//   });
//   return _.map(result, function(val, key) {
//     return val;
//   });
// }



function show() {
    var a = [];

    for (let i = 0; i < 1000; i++) {
        a = [
            ...a,
            {
                id: i + 1,
                name: 'aaaaaa' + i,
                age: 20 + i
            }
        ]
    }
    return a;
}
// var a = [1,2,3,4,5,6,7,8,9];
function partition(items, size) {
    
    var p = [];

    for (var i=Math.floor(items.length/size); i-->0; ) {
        p[i]=items.slice(i*size, (i+1)*size);
    }
    return p;
}
let a = show();
console.log(a);

console.log(partition(a, 3));