import './style.css';
import { setupCounter } from './counter.js';
import { supabase } from './supabase.js';
import { mostrarLogin } from './login.js';
import { mostrarRegistro } from './registro.js';
import { mostrarDatos } from './usuario.js';

let pokemones = [];
let totalPokes = 1026;
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let misNumeros = JSON.parse(localStorage.getItem("misNumeros")) || [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await validarSesion();
  if (!user) {
    document.querySelector(".c-nav").innerHTML = "";
    document.querySelector("#app").innerHTML = "";
    mostrarLogin();
  } else {
    console.log('Usuario logueado:', user.email);
    document.querySelector(".c-nav").innerHTML = `
      <button class="c-nav-item" onclick="General()">Home</button>
      <button class="c-nav-item" onclick="mostrarAlbum()">Album</button>
      <button class="c-nav-item" onclick="mostrarAleatorio()">Aleatorio</button>
      <button class="c-nav-item" onclick="mostrarFavoritos()">Favoritos</button>
      <button class="c-nav-item" onclick="mostrarDatos()">Usuario</button>
    `;
    General();
  }
});

async function validarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

async function conexionLista() {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${totalPokes}`);
  const data = await res.json();
  return data.results;
}

async function General() {
  if (pokemones.length === 0) {
    pokemones = await conexionLista();
  }
  mostrarLista(pokemones);
}

export function mostrarLista(lista) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const seccion = document.createElement("section");
  seccion.classList.add("c-lista");

  const buscador = document.createElement("input");
  buscador.classList.add("c-buscador");
  buscador.type = "text";
  buscador.placeholder = "Buscar Pokémon...";
  buscador.addEventListener("input", (evento) => buscarPoke(evento, lista));

  const tipos = [
    "All", "normal", "fighting", "flying", "poison", "ground",
    "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric",
    "psychic", "ice", "dragon", "dark", "fairy", "stellar", "shadow", "unknown"
  ];
  const filtro = document.createElement("div");
  filtro.classList.add("filtro");
  filtro.innerHTML = tipos.map(tipo => `<button data-tipo="${tipo}">${tipo}</button>`).join("");
  filtro.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => filtrarPorTipo(btn.dataset.tipo));
  });

  seccion.innerHTML = generarLista(lista);
  app.appendChild(buscador);
  app.appendChild(filtro);
  app.appendChild(seccion);
}

function generarLista(lista) {
  return lista.map(poke => {
    let id;
    let name;
    if (poke.url) {
      id = poke.url.split("/")[6];
      name = poke.name;
    } else {
      id = poke.id;
      name = poke.name;
    }

    const esFavorito = favoritos.some(p => Number(p.id) === Number(id));
    return `
      <div class="c-lista-pokemon poke-${id}" onclick="mostrarDetalle('${id}')">
        <p>#${id}</p>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" width="auto" height="60" loading="lazy" alt="${name}">
        <p>${name}</p>
      </div>`;
  }).join("");
}

function buscarPoke(evento, lista) {
  const texto = evento.target.value.toLowerCase();
  let listaFiltrada = lista;

  if (texto.length >= 3 && isNaN(texto)) {
    listaFiltrada = lista.filter(pokemon => pokemon.name.includes(texto));
  } else if (!isNaN(texto)) {
    listaFiltrada = lista.filter(pokemon => pokemon.url && pokemon.url.includes("/" + texto));
  } else if (texto.length === 0) {
    listaFiltrada = lista;
  }

  document.querySelector(".c-lista").innerHTML = generarLista(listaFiltrada);
}

async function filtrarPorTipo(untipo) {
  if (untipo === "All") {
    General(pokemones);
  } else {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${untipo}`);
      const data = await res.json();
      const pokemonesFiltrados = data.pokemon.map(p => p.pokemon);
      mostrarLista(pokemonesFiltrados);
    } catch (err) {
      console.error("Error al filtrar:", err);
      document.getElementById("app").innerHTML = `<p>Error al cargar Pokémon de tipo "${untipo}".</p>`;
    }
  }
}

function toggleFavorito(id, nombre) {
  id = Number(id);
  const existe = favoritos.some(p => Number(p.id) === id);

  if (existe) {
    favoritos = favoritos.filter(p => Number(p.id) !== id);
    document.getElementById(`corazon-${id}`).textContent = '🤍';
  } else {
    favoritos.push({ id, name: nombre, url: `https://pokeapi.co/api/v2/pokemon/${id}/` });
    document.getElementById(`corazon-${id}`).textContent = '❤️';
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function actualizarIconoFavorito(id) {
  id = Number(id);
  const corazonIcono = document.getElementById(`corazon-${id}`);
  if (!corazonIcono) return;
  if (favoritos.some(p => Number(p.id) === id)) {
    corazonIcono.textContent = '❤️';
  } else {
    corazonIcono.textContent = '🤍';
  }
}

async function mostrarDetalle(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const tipoPoke = data.types.map(t => `<span>${t.type.name}</span>`).join(" ");
  const app = document.getElementById("app");
  const esFavorito = favoritos.some(p => Number(p.id) === data.id);

  const detalle = `
    <section class="c-detalle">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png" alt="${data.name}" height="120" width="auto">
      <p>${data.name}</p>
      <p>#${data.id}</p>
      <p>${tipoPoke}</p>
      <p>Altura: ${data.height / 10} m / Peso: ${data.weight / 10} kg</p>
      <p>HP: ${data.stats[0].base_stat}</p>
      <p>Velocidad: ${data.stats[5].base_stat}</p>
      <p>Ataque: ${data.stats[1].base_stat} / Defensa: ${data.stats[2].base_stat}</p>
      <p>Ataque Especial: ${data.stats[3].base_stat} / Defensa Especial: ${data.stats[4].base_stat}</p>
      <button id="favorito-btn-${id}" onclick="toggleFavorito(${data.id}, '${data.name}')">
        <span id="corazon-${id}" class="corazon">${esFavorito ? '❤️' : '🤍'}</span> Favorito
      </button>
    </section>`;
  app.innerHTML = detalle;
  actualizarIconoFavorito(id);
}

function mostrarFavoritos() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const contenedor = document.createElement("section");
  contenedor.classList.add("c-lista");
  contenedor.innerHTML = generarLista(favoritos);
  app.appendChild(contenedor);
}

async function mostrarAleatorio() {
  const pokemones = await conexionLista();
  const totalPokes = pokemones.length;
  const nuevosAleatorios = [];

  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * totalPokes);
    const pokemon = pokemones[index];
    const id = pokemon.url.split("/")[6];

    nuevosAleatorios.push({
      id: id,
      name: pokemon.name,
      url: `https://pokeapi.co/api/v2/pokemon/${id}/`
    });

    if (!misNumeros.includes(Number(id))) {
      misNumeros.push(Number(id));
    }
  }

  localStorage.setItem("misNumeros", JSON.stringify(misNumeros));

  const app = document.getElementById("app");
  app.innerHTML = "";

  const contenedor = document.createElement("section");
  contenedor.classList.add("c-lista");
  contenedor.innerHTML = generarLista(nuevosAleatorios);
  app.appendChild(contenedor);
}

function mostrarAlbum() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const seccion = document.createElement("section");
  seccion.classList.add("c-lista", "c-mios");

  let misPokes = "";
  for (let i = 1; i < totalPokes; i++) {
    if (misNumeros.includes(i)) {
      misPokes += `
        <div class="c-unpoke c-mios-pokemon poke-${i}" onclick="mostrarDetalle('${i}')">
          <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png" width="auto" height="45" loading="lazy" alt="${i}">
          <p>${i}</p>
        </div>`;
    } else {
      misPokes += `<div class="c-unpoke"><p>${i}</p></div>`;
    }
  }

  seccion.innerHTML = misPokes;
  const contador = document.createElement("p");
  contador.textContent = `${misNumeros.length} / ${totalPokes}`;
  app.appendChild(contador);
  app.appendChild(seccion);
}

// Exportar funciones globales
window.General = General;
window.mostrarLista = mostrarLista;
window.mostrarDetalle = mostrarDetalle;
window.toggleFavorito = toggleFavorito;
window.actualizarIconoFavorito = actualizarIconoFavorito;
window.mostrarFavoritos = mostrarFavoritos;
window.mostrarAleatorio = mostrarAleatorio;
window.mostrarAlbum = mostrarAlbum;
window.mostrarDatos = mostrarDatos;
