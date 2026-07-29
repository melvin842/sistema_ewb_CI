// LINKS ACTIVOS NAVBAR

const links = document.querySelectorAll(".navbar a");

links.forEach(link => {

    link.addEventListener("click", () => {

        links.forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

    });

});


// EFECTO HEADER SCROLL

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if(window.scrollY > 50){

        header.style.boxShadow = "0 5px 20px rgba(0,0,0,0.15)";
        header.style.background = "#ffffffee";
        header.style.backdropFilter = "blur(10px)";

    }else{

        header.style.boxShadow = "0 2px 10px #00000015";
        header.style.background = "white";

    }

});


// ANIMACION AL HACER SCROLL

const elementos = document.querySelectorAll(
    ".product-card, .benefit-card, .process-card, .history-content, .about-content, .history-gallery img"
)

const mostrarElementos = () => {
    const triggerBotton = window.innerHeight*0.85;

    elementos.forEach(elemento => {
        const elemntoTop = elemento .getBoundingClientRect().top;
        if(elemntoTop < triggerBotton){
            elemento.classList.add("show");
        }else{
            elemento.classList.remove("show");
        }
    });
};
window.addEventListener('scroll',mostrarElementos);
mostrarElementos();

