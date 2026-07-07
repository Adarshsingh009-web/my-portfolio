/* ==========================================================================
   INTERACTIVE 3D DASHBOARD LOGIC (THREE.JS, GSAP, & CANVAS 3D)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CUSTOM CURSOR TRACKER ---
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.custom-cursor-dot');
    let mouseX = 0, mouseY = 0; // Current mouse coords
    let cursorX = 0, cursorY = 0; // Delayed cursor coords for trailing effect
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Instant position for the dot
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    });

    // Animate outer cursor circle with slight delay (smooth trailing)
    const animateCursor = () => {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        
        cursorX += dx * 0.15;
        cursorY += dy * 0.15;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Hover effect for interactive elements
    const hoverElements = document.querySelectorAll('a, button, .glass-panel, .timeline-item, .skill-tag');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // --- 2. THREE.JS: FULL-SCREEN PARTICLES & GRID BACKGROUND ---
    const canvas = document.querySelector('canvas.webgl');
    const scene = new THREE.Scene();

    // Responsive sizing
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 30;
    scene.add(camera);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Transparent to keep CSS cyber grid visible
        antialias: true
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle Generation
    const particlesCount = 1200;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Random coords in space
        posArray[i] = (Math.random() - 0.5) * 80;     // x
        posArray[i + 1] = (Math.random() - 0.5) * 80; // y
        posArray[i + 2] = (Math.random() - 0.5) * 80; // z

        // Cyberpunk colors: Mix of Cyan (#00f2fe) and Purple/Pink (#a18cd1)
        const isCyan = Math.random() > 0.5;
        if (isCyan) {
            colorsArray[i] = 0.0;     // R
            colorsArray[i + 1] = 0.95; // G
            colorsArray[i + 2] = 1.0;  // B
        } else {
            colorsArray[i] = 0.63;     // R
            colorsArray[i + 1] = 0.55; // G
            colorsArray[i + 2] = 0.82;  // B
        }
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    // Particle texture (round dot instead of square block)
    const createParticleTexture = () => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 16;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        return new THREE.CanvasTexture(c);
    };

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: createParticleTexture()
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Subtle 3D Wireframe Floating Objects
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    const geometries = [
        new THREE.IcosahedronGeometry(2, 1),
        new THREE.OctahedronGeometry(1.5, 0),
        new THREE.TorusGeometry(3, 0.4, 8, 24)
    ];

    const materials = [
        new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.15 }),
        new THREE.MeshBasicMaterial({ color: 0xa18cd1, wireframe: true, transparent: true, opacity: 0.15 }),
        new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true, transparent: true, opacity: 0.1 })
    ];

    const meshes = [];
    for (let i = 0; i < 4; i++) {
        const geom = geometries[i % geometries.length];
        const mat = materials[i % materials.length];
        const mesh = new THREE.Mesh(geom, mat);
        
        // Spread objects out in the scene background
        mesh.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20 - 15
        );
        floatingGroup.add(mesh);
        meshes.push(mesh);
    }

    // Parallax mouse movements
    let targetX = 0;
    let targetY = 0;
    
    document.addEventListener('mousemove', (event) => {
        targetX = (event.clientX / sizes.width - 0.5) * 6;
        targetY = -(event.clientY / sizes.height - 0.5) * 6;
    });

    // Scroll reactions
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // Resize handler
    window.addEventListener('resize', () => {
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Core Animation Frame Loop
    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // 1. Slow particle rotation
        particlesMesh.rotation.y = elapsedTime * 0.03;
        particlesMesh.rotation.x = elapsedTime * 0.015;

        // 2. Parallax camera tracking (smoothing out movements)
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;

        // 3. Scroll effects: Sink and twist particles as user scrolls
        particlesMesh.position.y = -scrollY * 0.015;
        particlesMesh.rotation.z = scrollY * 0.0005;

        // 4. Floating geometries self-rotation and waving
        meshes.forEach((mesh, index) => {
            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.003;
            // Oscillate floating up and down
            mesh.position.y += Math.sin(elapsedTime + index) * 0.005;
        });

        renderer.render(scene, camera);
        window.requestAnimationFrame(tick);
    };

    tick();

    // --- 3. 3D SKILLS TAG CLOUD / SPHERE ---
    const initSkillsSphere = () => {
        const sCanvas = document.getElementById('skills3dCanvas');
        if (!sCanvas) return;
        
        const ctx = sCanvas.getContext('2d');
        let width = sCanvas.offsetWidth;
        let height = sCanvas.offsetHeight;
        
        // Match canvas layout size
        sCanvas.width = width;
        sCanvas.height = height;

        const skills = [
            { text: 'C Programming', weight: 1.2 },
            { text: 'HTML / CSS', weight: 1.0 },
            { text: 'Java Core', weight: 1.1 },
            { text: 'JavaScript', weight: 1.0 },
            { text: 'Strategy', weight: 1.3 },
            { text: 'Deep Learning', weight: 1.2 },
            { text: 'AI / ML', weight: 1.1 },
            { text: 'Data Structures', weight: 1.2 },
            { text: 'Algorithms', weight: 1.25 },
            { text: 'Product Ideation', weight: 1.0 },
            { text: 'Startup Mindset', weight: 1.2 },
            { text: 'Problem Solving', weight: 1.1 }
        ];

        const tags = [];
        const radius = Math.min(width, height) * 0.38;
        
        // Math to calculate even point distributions on a sphere
        for (let i = 0; i < skills.length; i++) {
            const k = -1 + (2 * (i + 1) - 1) / skills.length;
            const theta = Math.acos(k);
            const phi = Math.sqrt(skills.length * Math.PI) * theta;
            
            tags.push({
                text: skills[i].text,
                weight: skills[i].weight,
                x: radius * Math.sin(theta) * Math.cos(phi),
                y: radius * Math.sin(theta) * Math.sin(phi),
                z: radius * Math.cos(theta),
                projX: 0,
                projY: 0,
                scale: 1,
                alpha: 1
            });
        }

        // Angles and speeds
        let angleX = 0.005;
        let angleY = 0.005;
        
        // Slow down speed by default
        let speedX = 0.003;
        let speedY = 0.003;
        
        // React to mouse movement inside skills container
        const container = document.querySelector('.skills-sphere-container');
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - rect.width/2;
            const mouseY = e.clientY - rect.top - rect.height/2;
            
            // Adjust rotation speeds based on mouse coordinates relative to center
            speedY = mouseX * 0.00008;
            speedX = -mouseY * 0.00008;
        });
        
        container.addEventListener('mouseleave', () => {
            // Restore slow auto-rotation
            speedX = 0.003;
            speedY = 0.003;
        });

        // Projection loop
        const rotateAndDraw = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Rotate tags around X-axis
            const cosX = Math.cos(speedX);
            const sinX = Math.sin(speedX);
            // Rotate tags around Y-axis
            const cosY = Math.cos(speedY);
            const sinY = Math.sin(speedY);
            
            tags.forEach(tag => {
                // X rotation
                let y1 = tag.y * cosX - tag.z * sinX;
                let z1 = tag.z * cosX + tag.y * sinX;
                
                // Y rotation
                let x2 = tag.x * cosY - z1 * sinY;
                let z2 = z1 * cosY + tag.x * sinY;
                
                tag.x = x2;
                tag.y = y1;
                tag.z = z2;
                
                // 3D Perspective Projection
                const focalLength = 300;
                const perspective = focalLength / (focalLength + tag.z);
                tag.projX = tag.x * perspective + width / 2;
                tag.projY = tag.y * perspective + height / 2;
                
                // Opacity & scaling based on depth
                tag.scale = perspective;
                tag.alpha = (tag.z + radius) / (2 * radius) * 0.7 + 0.3; // Value between 0.3 and 1.0
            });

            // Sort tags by Z (depth) so closer items are rendered on top of far items
            const sortedTags = [...tags].sort((a, b) => b.z - a.z);

            // Draw connecting webgl-like lines for tech vibe
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
            ctx.lineWidth = 1;
            for (let i = 0; i < sortedTags.length; i++) {
                for (let j = i + 1; j < sortedTags.length; j++) {
                    const dist = Math.hypot(sortedTags[i].x - sortedTags[j].x, sortedTags[i].y - sortedTags[j].y, sortedTags[i].z - sortedTags[j].z);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(sortedTags[i].projX, sortedTags[i].projY);
                        ctx.lineTo(sortedTags[j].projX, sortedTags[j].projY);
                        ctx.stroke();
                    }
                }
            }

            // Draw Tags
            sortedTags.forEach(tag => {
                const fontSize = Math.round(13 * tag.scale * tag.weight);
                ctx.font = `600 ${fontSize}px var(--font-heading)`;
                
                // Styling color based on weight & front/back position
                let fillStyle;
                if (tag.z > 0) {
                    // Front tags (cyan glow)
                    fillStyle = `rgba(0, 242, 254, ${tag.alpha})`;
                } else {
                    // Back tags (dimmed purple)
                    fillStyle = `rgba(161, 140, 209, ${tag.alpha * 0.7})`;
                }
                
                ctx.fillStyle = fillStyle;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Draw shadow for front glowing tags
                if (tag.z > 20) {
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
                } else {
                    ctx.shadowBlur = 0;
                }
                
                ctx.fillText(tag.text, tag.projX, tag.projY);
            });
            
            requestAnimationFrame(rotateAndDraw);
        };
        
        rotateAndDraw();

        // Responsive handling for sphere
        window.addEventListener('resize', () => {
            width = sCanvas.offsetWidth;
            height = sCanvas.offsetHeight;
            sCanvas.width = width;
            sCanvas.height = height;
        });
    };

    initSkillsSphere();

    // --- 4. NAVIGATION ACTIVE SECTION TRACKER ---
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const activeNavigationLink = () => {
        let currentSectionId = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            // Adjust threshold offset for tracking trigger
            if (scrollY >= (sectionTop - 250)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', activeNavigationLink);

    // --- 5. GSAP SCROLL ENHANCEMENTS & REVEALS ---
    if (typeof gsap !== 'undefined') {
        // Simple entry fade animations
        gsap.from('.hero-title', { opacity: 0, y: 30, duration: 1.2, ease: 'power4.out', delay: 0.2 });
        gsap.from('.hero-headline', { opacity: 0, y: 20, duration: 1.2, ease: 'power4.out', delay: 0.4 });
        gsap.from('.about-card', { opacity: 0, y: 25, duration: 1.2, ease: 'power4.out', delay: 0.6 });
        gsap.from('.cta-group', { opacity: 0, y: 15, duration: 1.2, ease: 'power4.out', delay: 0.8 });
        
        gsap.from('.hero-visual', { 
            opacity: 0, 
            scale: 0.9, 
            duration: 1.5, 
            ease: 'power3.out', 
            delay: 0.5 
        });

        // Intersection triggers for scrolling transitions
        const observerOptions = {
            threshold: 0.12,
            rootMargin: '0px 0px -50px 0px'
        };

        const revealOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // Trigger dynamic animations on inner elements using GSAP
                    if (entry.target.id === 'education') {
                        gsap.from('#education .timeline-item', {
                            opacity: 0,
                            x: -30,
                            stagger: 0.2,
                            duration: 0.8,
                            ease: 'power2.out'
                        });
                    }
                    
                    if (entry.target.id === 'interests') {
                        gsap.from('#interests .interest-card', {
                            opacity: 0,
                            y: 40,
                            stagger: 0.15,
                            duration: 0.8,
                            ease: 'back.out(1.4)'
                        });
                    }
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            revealOnScroll.observe(section);
        });
    }

    // --- 6. MOBILE NAVIGATION DRAWER TOGGLE ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    if (menuToggle && navLinksContainer) {
        menuToggle.addEventListener('click', () => {
            navLinksContainer.classList.toggle('show');
            const icon = menuToggle.querySelector('i');
            if (navLinksContainer.classList.contains('show')) {
                icon.className = 'fas fa-times';
                gsap.to('.nav-links', { 
                    display: 'flex', 
                    height: 'auto', 
                    opacity: 1, 
                    backgroundColor: 'rgba(10, 16, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    position: 'absolute',
                    top: '75px',
                    left: '0',
                    width: '100%',
                    flexDirection: 'column',
                    padding: '20px',
                    borderRadius: '15px',
                    duration: 0.3 
                });
            } else {
                icon.className = 'fas fa-bars';
                // Close menu
                gsap.to('.nav-links', { 
                    opacity: 0, 
                    height: 0, 
                    duration: 0.3,
                    onComplete: () => {
                        navLinksContainer.removeAttribute('style');
                    }
                });
            }
        });
    }

    // --- 7. CLICK/TAP CARD EXPANSION ---
    const expandableCards = document.querySelectorAll('.glass-panel, .tip-card, .project-card, .interest-card');
    
    expandableCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent expansion trigger if user clicks sub-links, buttons, or form controls
            if (e.target.closest('a') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.social-link-item')) {
                return;
            }
            
            const isAlreadyExpanded = card.classList.contains('active-expanded');
            
            // Close all other active cards
            expandableCards.forEach(c => c.classList.remove('active-expanded'));
            
            // If the card was not already expanded, expand it
            if (!isAlreadyExpanded) {
                card.classList.add('active-expanded');
            }
        });
    });

    // Close expanded cards on clicking empty background space
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.glass-panel') && !e.target.closest('.tip-card') && !e.target.closest('.project-card') && !e.target.closest('.interest-card')) {
            expandableCards.forEach(c => c.classList.remove('active-expanded'));
        }
    });
});
