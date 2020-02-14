let a = 5;
let b = 6;

console.log(a);

if(a < 5){
    console.log(a-5);
}else if(b == 6){
    console.log(a*5);
}else{
    console.log(b)
}

for(let i=0, j=10; i<10 && j>0; i++, j--){
    console.log(i);
}

let d = 10
while(d > 0){
    console.log(d--); // primero asigna y luego hace la operación
    //console.log(--d); primero hace la operación y luego asigna
}

lista = []
lista.push(4 ,5, 3, 5);
console.log(lista);
console.log(lista[2]);
console.log(lista);
lista.reverse();
console.log(lista);

function sumaCinco(elemento){
    elemento += 5;
    console.log(elemento + 5);
}

lista.forEach(sumaCinco);

console.log(lista);

for(elemento of lista){
    console.log(elemento);
    console.log(lista[elemento]);
}

lista = [4, 5, 6, 3, 2, 1]
lista.sort((a, b) => b - a)
console.log(lista);


