// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        navbar.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements on page load
document.addEventListener('DOMContentLoaded', () => {
    // Observe cards
    const cards = document.querySelectorAll('.about-card, .work-item, .reach-card, .partnership-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Mapa das Dinastias
    const mapRoot = document.getElementById('mapPoints');
    const panelName = document.getElementById('dynastyName');
    const panelMeta = document.getElementById('dynastyMeta');
    const panelList = document.getElementById('dynastyList');

    if (mapRoot && panelName && panelMeta && panelList) {
        const dynasties = [
            {
                id: 'maranhao',
                nome: 'Família Sarney',
                estado: 'Maranhão (MA)',
                cargos: 'Governador, Senador, Deputado Federal',
                decadas: '1960-2020',
                pontos: [
                    'José Sarney - Governador (1966-1971), Senador, Presidente',
                    'Roseana Sarney - Governadora (1995-2002, 2009-2014)',
                    'José Sarney Filho - Deputado Federal'
                ],
                pos: { left: '62%', top: '32%' }
            },
            {
                id: 'alagoas',
                nome: 'Família Calheiros',
                estado: 'Alagoas (AL)',
                cargos: 'Senador, Governador, Deputado',
                decadas: '1990-2020',
                pontos: [
                    'Renan Calheiros - Senador, Presidente do Senado',
                    'Renan Filho - Governador (2015-2022), Ministro',
                    'Olavo Calheiros - Deputado Estadual'
                ],
                pos: { left: '57%', top: '52%' }
            },
            {
                id: 'para',
                nome: 'Família Barbalho',
                estado: 'Pará (PA)',
                cargos: 'Governador, Senador, Prefeito',
                decadas: '1980-2020',
                pontos: [
                    'Jader Barbalho - Governador (1983-1987), Senador',
                    'Helder Barbalho - Governador (2019- )',
                    'Simone Morgado - Deputada Federal'
                ],
                pos: { left: '70%', top: '28%' }
            },
            {
                id: 'bahia',
                nome: 'Família Magalhães',
                estado: 'Bahia (BA)',
                cargos: 'Governador, Senador, Prefeito',
                decadas: '1970-2010',
                pontos: [
                    'ACM (Antônio Carlos Magalhães) - Governador, Senador',
                    'ACM Neto - Prefeito de Salvador (2013-2020), Deputado',
                    'Luiz Eduardo Magalhães - Deputado Federal'
                ],
                pos: { left: '58%', top: '45%' }
            },
            {
                id: 'ceara',
                nome: 'Família Gomes',
                estado: 'Ceará (CE)',
                cargos: 'Governador, Prefeito, Ministro',
                decadas: '1990-2020',
                pontos: [
                    'Ciro Gomes - Governador (1991-1994), Ministro',
                    'Cid Gomes - Governador (2007-2014), Senador',
                    'Ivo Gomes - Prefeito de Sobral'
                ],
                pos: { left: '63%', top: '40%' }
            }
        ];

        // Render points
        dynasties.forEach((dynasty, index) => {
            const dot = document.createElement('button');
            dot.className = 'map-point';
            dot.style.left = dynasty.pos.left;
            dot.style.top = dynasty.pos.top;
            dot.setAttribute('aria-label', dynasty.nome);
            dot.dataset.id = dynasty.id;
            dot.style.transitionDelay = `${index * 50}ms`;
            mapRoot.appendChild(dot);
        });

        const renderDynasty = (dynasty) => {
            panelName.textContent = dynasty.nome;
            panelMeta.textContent = `${dynasty.estado} • ${dynasty.cargos} • ${dynasty.decadas}`;
            panelList.innerHTML = '';
            dynasty.pontos.forEach(item => {
                const li = document.createElement('div');
                li.className = 'dynasty-item';
                li.innerHTML = `<strong>${dynasty.nome}</strong> — ${item}`;
                panelList.appendChild(li);
            });
        };

        const dots = Array.from(mapRoot.querySelectorAll('.map-point'));
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                const found = dynasties.find(d => d.id === dot.dataset.id);
                if (found) renderDynasty(found);
            });
        });

        // Select first by default
        if (dynasties[0] && dots[0]) {
            dots[0].classList.add('active');
            renderDynasty(dynasties[0]);
        }
    }
});