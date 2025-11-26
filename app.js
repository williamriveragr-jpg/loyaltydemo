function initWheel() {
    wheelElement.innerHTML = '';
    const totalPrizes = wheelPrizes.length;
    const segmentAngle = 360 / totalPrizes;
    
    console.log('🎨 Inicializando ruleta:');
    console.log('Total de premios:', totalPrizes);
    console.log('Ángulo por segmento:', segmentAngle + '°');
    
    // Crear gradiente cónico dinámico
    let conicGradient = 'conic-gradient(from 0deg, ';
    let gradientStops = [];
    
    wheelPrizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        const color = prize.color || '#667eea';
        
        gradientStops.push(`${color} ${startAngle}deg ${endAngle}deg`);
        
        // Crear etiqueta de texto
        const label = document.createElement('div');
        label.className = 'wheel-label';
        label.textContent = prize.name;
        
        // Calcular posición del texto (más cerca del borde)
        const centerAngle = startAngle + (segmentAngle / 2);
        const centerRad = (centerAngle - 90) * Math.PI / 180; // -90 para que 0° esté arriba
        const radius = 65; // Más cerca del borde (era 50)
        
        const x = 50 + radius * Math.cos(centerRad);
        const y = 50 + radius * Math.sin(centerRad);
        
        label.style.position = 'absolute';
        label.style.left = `${x}%`;
        label.style.top = `${y}%`;
        
        // IMPORTANTE: Rotar el texto 90° para ponerlo vertical + el ángulo del segmento
        const textRotation = centerAngle + 90; // +90 para texto vertical
        label.style.transform = `translate(-50%, -50%) rotate(${textRotation}deg)`;
        
        label.style.color = 'white';
        label.style.fontSize = '11px';
        label.style.fontWeight = 'bold';
        label.style.textShadow = '1px 1px 3px rgba(0,0,0,0.8)';
        label.style.whiteSpace = 'nowrap';
        label.style.pointerEvents = 'none';
        label.style.textAlign = 'center';
        
        label.setAttribute('data-prize-id', prize.id);
        label.setAttribute('data-prize-index', index);
        
        wheelElement.appendChild(label);
        
        console.log(`Segmento ${index}: ${prize.name} (${startAngle}° - ${endAngle}°)`);
    });
    
    conicGradient += gradientStops.join(', ') + ')';
    wheelElement.style.background = conicGradient;
    
    console.log('✅ Ruleta inicializada con conic-gradient');
}
