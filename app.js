// ============================================
// CONFIGURACIÓN (DECLARAR PRIMERO)
// ============================================
const WORKER_URL = 'https://young-snowflake-1f82.williamriveragr.workers.dev';
const PROGRAM_ID = '0lpd20000001aO1AAI';

// Estado del juego
let currentMember = {};
let isSpinning = false;

// Premios de la ruleta (se cargarán dinámicamente)
let wheelPrizes = [];
let participantGameRewards = [];


// ============================================
// REFERENCIAS AL DOM (DECLARAR AL INICIO)
// ============================================
const form = document.getElementById('loyaltyForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const messageDiv = document.getElementById('message');

// Referencias para la ruleta
const wheelLoginDiv = document.getElementById('wheelLogin');
const wheelGameDiv = document.getElementById('wheelGame');
const wheelMembershipInput = document.getElementById('wheelMembershipNumber');
const loginLoading = document.getElementById('wheelLoginLoading');
const loginMessage = document.getElementById('wheelLoginMessage');
const spinButton = document.getElementById('spinButton');
const wheelElement = document.getElementById('wheel');
const resultDiv = document.getElementById('wheelResult');
const wheelPrizeText = document.getElementById('wheelPrize');

// ============================================
// NAVEGACIÓN
// ============================================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });
    
    document.getElementById('navMenu').classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('navToggle').addEventListener('click', () => {
        document.getElementById('navMenu').classList.toggle('active');
    });

    // ============================================
    // FORMULARIO DE REGISTRO
    // ============================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            showMessage('Por favor, complete todos los campos requeridos', 'error');
            return;
        }
    
        const membershipNumber = generateMembershipNumber();
        
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            birthDate: document.getElementById('birthDate').value,
            programId: PROGRAM_ID,
            enrollmentChannel: document.getElementById('enrollmentChannel').value
        };
    
        document.getElementById('membershipNumber').value = membershipNumber;
        
        submitBtn.disabled = true;
        loading.classList.add('show');
        messageDiv.classList.remove('show');
    
        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: "createMember",
                    data: formData
                })
            });
    
            const result = await response.json();
            
            if (result.success) {
                showMessage(`¡Registro exitoso! Número de membresía: ${result.data.membershipNumber}`, 'success');
                
                setTimeout(() => {
                    form.reset();
                    showSection('home');
                }, 3000);
            } else {
                showMessage('Error al registrar: ' + result.error, 'error');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error al registrar: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            loading.classList.remove('show');
        }
    });
});

// ============================================
// BÚSQUEDA DE PERFIL
// ============================================
async function searchProfile() {
    const searchInput = document.getElementById('searchInput').value.trim();
    const loadingProfile = document.getElementById('loadingProfile');
    const profileMessage = document.getElementById('profileMessage');
    const profileCard = document.getElementById('profileCard');
    
    if (!searchInput) {
        showProfileMessage('Por favor, ingresa un número de membresía', 'error');
        return;
    }
    
    loadingProfile.classList.add('show');
    profileMessage.classList.remove('show');
    profileCard.classList.remove('show');
    
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getMember",
                data: { membershipNumber: searchInput }
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            showProfileMessage(result.error || 'Perfil no encontrado.', 'error');
            return;
        }
        
        displayProfile(result.data);
        profileCard.classList.add('show');
        
    } catch (error) {
        console.error('Error:', error);
        showProfileMessage('Error al buscar perfil.', 'error');
    } finally {
        loadingProfile.classList.remove('show');
    }
}

function displayProfile(profile) {
    const initials = (profile.contact.firstName.charAt(0) + profile.contact.lastName.charAt(0)).toUpperCase();
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profileName').textContent = `${profile.contact.firstName} ${profile.contact.lastName}`;
    document.getElementById('profileTier').textContent = profile.tier;
    document.getElementById('totalPoints').textContent = profile.points.total.toLocaleString();
    document.getElementById('memberSince').textContent = profile.memberSince;
    document.getElementById('profileEmail').textContent = profile.contact.email;
    document.getElementById('profilePhone').textContent = profile.contact.phone;
    document.getElementById('profileMembership').textContent = profile.membershipNumber;
    document.getElementById('profileChannel').textContent = profile.enrollmentChannel;
    
    const enrollmentDate = new Date(profile.enrollmentDate);
    document.getElementById('profileEnrollmentDate').textContent = enrollmentDate.toLocaleDateString('es-ES');
    document.getElementById('profileStatus').textContent = profile.status === 'Active' ? 'Activo' : profile.status;
    
    displayCurrencies(profile.points.currencies);
}

function displayCurrencies(currencies) {
    const profileStats = document.querySelector('.profile-stats');
    const existingCurrencyCards = profileStats.querySelectorAll('.currency-card');
    existingCurrencyCards.forEach(card => card.remove());
    
    const availableCard = document.getElementById('availablePoints')?.closest('.stat-card');
    const tierCard = document.getElementById('tierPoints')?.closest('.stat-card');
    if (availableCard) availableCard.remove();
    if (tierCard) tierCard.remove();
    
    currencies.forEach((currency, index) => {
        const card = document.createElement('div');
        card.className = 'stat-card currency-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="stat-value">${currency.balance.toLocaleString()}</div>
            <div class="stat-label">${currency.name}</div>
        `;
        
        const memberSinceCard = document.getElementById('memberSince').closest('.stat-card');
        profileStats.insertBefore(card, memberSinceCard);
    });
}

// ============================================
// SPIN THE WHEEL
// ============================================
async function loadGamePrizes(gameName) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getGames",
                data: { 
                    gameName: gameName,
                    membershipNumber: wheelMembershipInput.value.trim()
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // SEPARAR: Premios del juego (gameRewards)
            wheelPrizes = result.data.gameRewards.map(reward => ({
                id: reward.gameRewardId,
                name: reward.name,
                value: reward.rewardValue || 0,
                color: reward.color,
                rewardType: reward.rewardType,
                description: reward.description,
                imageUrl: reward.imageUrl
            }));
            
            // SEPARAR: Premios del participante (participantGameRewards)
            participantGameRewards = result.data.participantGameRewards;
            
            console.log('=== INFORMACIÓN DEL JUEGO ===');
            console.log('Premios del juego:', wheelPrizes);
            console.log('Premios del participante:', participantGameRewards);
            console.log('Puede jugar:', result.data.canPlay);
            
            // IMPORTANTE: Verificar si ya existe un premio ganador de Salesforce
            const rewardedPrize = participantGameRewards.find(pr => pr.status === 'Rewarded' && pr.gameRewardId);
            
            if (rewardedPrize) {
                // Salesforce ya determinó el premio ganador
                console.log('⚠️ Premio ya determinado por Salesforce:', rewardedPrize.gameRewardId);
                currentMember.winningPrizeId = rewardedPrize.gameRewardId;
                currentMember.gameParticipantRewardId = rewardedPrize.gameParticipantRewardId;
                
                // Solo animar la ruleta
            } else {
                // Verificar si puede jugar
                const pendingReward = participantGameRewards.find(pr => pr.status === 'YetToReward');
                
                if (!pendingReward) {
                    alert('No tienes oportunidades disponibles para este juego.');
                    return false;
                }
                
                currentMember.gameParticipantRewardId = pendingReward.gameParticipantRewardId;
                console.log('Game Participant Reward ID:', currentMember.gameParticipantRewardId);
            }
            
            return true;
        } else {
            console.error('Error cargando premios:', result.error);
            alert('Error: ' + result.error);
            return false;
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los premios del juego');
        return false;
    }
}

function initWheel() {
    wheelElement.innerHTML = '';
    const totalPrizes = wheelPrizes.length;
    const segmentAngle = 360 / totalPrizes;
    
    console.log('🎨 Inicializando ruleta:');
    console.log('Total de premios:', totalPrizes);
    console.log('Ángulo por segmento:', segmentAngle);
    
    wheelPrizes.forEach((prize, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment';
        
        // Calcular rotación del segmento
        const rotation = index * segmentAngle;
        
        // Calcular el clip-path para crear el segmento tipo "pizza"
        // Usamos coordenadas polares convertidas a cartesianas
        const startAngle = 0;
        const endAngle = segmentAngle;
        
        // Convertir ángulos a radianes y luego a coordenadas cartesianas
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        
        const x1 = 50 + 50 * Math.cos(startRad);
        const y1 = 50 + 50 * Math.sin(startRad);
        const x2 = 50 + 50 * Math.cos(endRad);
        const y2 = 50 + 50 * Math.sin(endRad);
        
        // Aplicar estilos
        segment.style.transform = `rotate(${rotation}deg)`;
        segment.style.clipPath = `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`;
        segment.style.background = prize.color || '#667eea';
        
        // Agregar atributos data para debugging
        segment.setAttribute('data-prize-id', prize.id);
        segment.setAttribute('data-prize-index', index);
        segment.setAttribute('data-prize-name', prize.name);
        
        // Crear etiqueta de texto
        const label = document.createElement('span');
        label.textContent = prize.name;
        label.style.transform = `rotate(${segmentAngle / 2}deg)`; // Centrar texto
        segment.appendChild(label);
        
        wheelElement.appendChild(segment);
        
        console.log(`Segmento ${index}: ${prize.name} (ID: ${prize.id}) - Rotación: ${rotation}°`);
    });
    
    console.log('✅ Ruleta inicializada');
}

async function spinWheel() {
    if (isSpinning) return;
    
    // Verificar si hay un premio pendiente
    const pendingReward = participantGameRewards.find(pr => pr.status === 'YetToReward');
    
    if (!pendingReward) {
        alert('No tienes oportunidades disponibles para jugar en este momento.');
        return;
    }
    
    isSpinning = true;
    spinButton.disabled = true;
    spinButton.textContent = 'Girando...';
    resultDiv.classList.remove('show');

    try {
        console.log('🎲 Llamando a Salesforce...');
        console.log('GameParticipantRewardId:', pendingReward.gameParticipantRewardId);
        
        // PASO 1: Llamar a Salesforce para determinar el premio
        const playResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "recordGameReward",
                data: {
                    gameParticipantRewardId: pendingReward.gameParticipantRewardId
                }
            })
        });
        
        const playResult = await playResponse.json();
        
        if (!playResult.success) {
            throw new Error(playResult.error || 'Error al jugar');
        }
        
        console.log('🎯 Salesforce determinó el premio:', playResult.data);
        
        // PASO 2: Buscar el índice del premio ganador
        const gameRewardId = playResult.data.gameRewardId;
        const gameRewardData = playResult.data;
        
        const prizeIndex = wheelPrizes.findIndex(p => p.id === gameRewardId);
        
        if (prizeIndex === -1) {
            console.error('❌ Premio no encontrado');
            console.error('GameRewardId buscado:', gameRewardId);
            console.error('IDs disponibles:', wheelPrizes.map(p => `${p.name}: ${p.id}`));
            throw new Error(`Premio no encontrado: ${gameRewardId}`);
        }

        console.log('\n=== PREMIO GANADOR ===');
        console.log('Game Reward ID:', gameRewardId);
        console.log('Nombre:', gameRewardData.rewardName);
        console.log('Índice en ruleta:', prizeIndex);
        console.log('Nombre en ruleta:', wheelPrizes[prizeIndex].name);

        // PASO 3: CALCULAR ROTACIÓN
        const totalPrizes = wheelPrizes.length;
        const segmentAngle = 360 / totalPrizes;
        
        // Calcular el ángulo del centro del segmento ganador
        const segmentCenterAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
        
        // Número de vueltas completas
        const spins = 5;
        
        // Rotación final: 
        // - Dar 5 vueltas completas (spins * 360)
        // - Ajustar para que el centro del segmento quede arriba (360 - segmentCenterAngle)
        const finalRotation = (spins * 360) + (360 - segmentCenterAngle);

        console.log('\n📐 CÁLCULOS:');
        console.log('├─ Ángulo por segmento:', segmentAngle + '°');
        console.log('├─ Centro del segmento ganador:', segmentCenterAngle + '°');
        console.log('├─ Vueltas completas:', spins);
        console.log('└─ Rotación FINAL:', finalRotation + '°');

        // PASO 4: ANIMAR
        wheelElement.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.29, 0.98)';
        wheelElement.style.transform = `rotate(${finalRotation}deg)`;

        console.log('🎬 Animación iniciada...');

        // PASO 5: Esperar fin de animación
        await new Promise(resolve => setTimeout(resolve, 4100));

        console.log('✅ Animación completada');

        // PASO 6: Mostrar resultado
        let prizeMessage = '';
        let detailMessage = '';
        
        if (gameRewardData.rewardType === 'LoyaltyPoints') {
            const points = gameRewardData.rewardValue || 0;
            prizeMessage = `🎉 ¡Has ganado ${points.toLocaleString()} puntos! 🎉`;
            detailMessage = `Los puntos han sido acreditados automáticamente.`;
            if (gameRewardData.issuedRewardReference) {
                detailMessage += `\n\nID: ${gameRewardData.issuedRewardReference}`;
            }
        } else if (gameRewardData.rewardType === 'Voucher') {
            prizeMessage = `🎁 ¡Has ganado: ${gameRewardData.rewardName}! 🎁`;
            detailMessage = `El voucher está disponible en tu perfil.`;
            if (gameRewardData.issuedRewardReference) {
                detailMessage += `\n\nID: ${gameRewardData.issuedRewardReference}`;
            }
        } else {
            prizeMessage = `${gameRewardData.rewardName} 😔`;
            detailMessage = '¡Sigue intentando!';
        }

        wheelPrizeText.textContent = prizeMessage;
        resultDiv.classList.add('show');

        // Actualizar estado local
        const rewardIndex = participantGameRewards.findIndex(
            pr => pr.gameParticipantRewardId === pendingReward.gameParticipantRewardId
        );
        
        if (rewardIndex !== -1) {
            participantGameRewards[rewardIndex].status = 'Rewarded';
            participantGameRewards[rewardIndex].gameRewardId = gameRewardId;
            participantGameRewards[rewardIndex].issuedRewardReference = gameRewardData.issuedRewardReference;
        }

        setTimeout(() => {
            alert(prizeMessage + '\n\n' + detailMessage);
            setTimeout(() => resetWheel(), 2000);
        }, 500);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
        spinButton.disabled = false;
        spinButton.textContent = '🎰 Girar Ruleta';
        isSpinning = false;
    }
}


async function startWheel() {
    const membershipNumber = wheelMembershipInput.value.trim();
    
    if (!membershipNumber) {
        showWheelLoginMessage('Por favor, ingresa tu número de membresía', 'error');
        return;
    }
    
    loginLoading.classList.add('show');
    loginMessage.classList.remove('show');
    
    try {
        // Verificar que el miembro existe
        const memberResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getMember",
                data: { membershipNumber }
            })
        });

        const memberResult = await memberResponse.json();
        
        if (!memberResult.success) {
            showWheelLoginMessage('Miembro no encontrado. Verifica tu número.', 'error');
            loginLoading.classList.remove('show');
            return;
        }
        
        currentMember = memberResult.data;
        
        // Cargar los premios del juego
        const prizesLoaded = await loadGamePrizes('Super Spin Rewards');
        
        if (!prizesLoaded) {
            showWheelLoginMessage('Error al cargar los premios del juego', 'error');
            loginLoading.classList.remove('show');
            return;
        }
        
        // Verificar si puede jugar
        const canPlay = participantGameRewards.some(pr => pr.status === 'YetToReward');
        
        if (!canPlay) {
            showWheelLoginMessage('No tienes oportunidades disponibles para este juego.', 'error');
            loginLoading.classList.remove('show');
            return;
        }
        
        // Mostrar el juego
        wheelLoginDiv.style.display = 'none';
        wheelGameDiv.classList.add('active');
        initWheel();
        
        console.log('✅ Juego cargado correctamente');
        console.log('Premios disponibles:', wheelPrizes.length);
        console.log('Oportunidades pendientes:', participantGameRewards.filter(pr => pr.status === 'YetToReward').length);
        
    } catch (error) {
        console.error('Error:', error);
        showWheelLoginMessage('Error al verificar membresía.', 'error');
    } finally {
        loginLoading.classList.remove('show');
    }
}

function resetWheel() {
    // Resetear interfaz
    spinButton.disabled = false;
    spinButton.textContent = '🎰 Girar Ruleta';
    isSpinning = false;
    resultDiv.classList.remove('show');
    
    // Resetear rotación de la ruleta
    wheelElement.style.transition = 'none';
    wheelElement.style.transform = 'rotate(0deg)';
    
    // Forzar reflow
    void wheelElement.offsetHeight;
    
    // Volver al login
    setTimeout(() => {
        wheelGameDiv.classList.remove('active');
        wheelLoginDiv.style.display = 'block';
        wheelMembershipInput.value = '';
        wheelElement.innerHTML = '';
        currentMember = null;
        wheelPrizes = [];
        participantGameRewards = [];
    }, 100);
}
function selectPrizeByProbability() {
    const availablePrizes = wheelPrizes.filter(prize => prize.isAvailable);
    
    if (availablePrizes.length === 0) {
        return wheelPrizes.find(p => p.rewardType === 'NoReward') || wheelPrizes[0];
    }
    
    const totalProbability = availablePrizes.reduce((sum, prize) => sum + prize.winProbability, 0);
    let random = Math.random() * totalProbability;
    let cumulativeProbability = 0;
    
    for (const prize of availablePrizes) {
        cumulativeProbability += prize.winProbability;
        
        if (random <= cumulativeProbability) {
            return prize;
        }
    }
    
    return availablePrizes[availablePrizes.length - 1];
}

async function createTransaction(memberId, amount, productName, rewardDefinitionId) {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            operation: "createTransaction",
            data: {
                memberId: memberId,
                amount: amount,
                transactionType: "Accrual",
                journalType: "Accrual",
                journalSubType: "Gamification",
                productName: productName,
                rewardDefinitionId: rewardDefinitionId
            }
        })
    });
    return await response.json();
}

async function createVoucher(memberId, voucherDefinitionId, voucherName) {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            operation: "createVoucher",
            data: {
                memberId: memberId,
                voucherDefinitionId: voucherDefinitionId,
                voucherName: voucherName
            }
        })
    });
    return await response.json();
}

// ============================================
// COMPRA DE PRODUCTOS
// ============================================
async function buyProduct(productName, points) {
    const membershipNumber = prompt('Ingresa tu número de membresía para canjear:');
    
    if (!membershipNumber) {
        alert('Debes ingresar tu número de membresía');
        return;
    }
    
    if (!confirm(`¿Deseas canjear ${(points * 100).toLocaleString()} puntos por ${productName}?`)) {
        return;
    }
    
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading show';
    loadingMessage.innerHTML = '<div class="spinner"></div><p>Procesando canje...</p>';
    document.querySelector('#canjear').appendChild(loadingMessage);
    
    try {
        const memberResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getMember",
                data: { membershipNumber: membershipNumber }
            })
        });
        
        const memberResult = await memberResponse.json();
        
        if (!memberResult.success) {
            alert('Miembro no encontrado. Verifica tu número de membresía.');
            return;
        }
        
        if (memberResult.data.points.total < points) {
            alert(`No tienes suficientes puntos. Necesitas ${points.toLocaleString()} puntos pero solo tienes ${memberResult.data.points.total.toLocaleString()}.`);
            return;
        }
        
        const transactionResult = await createRedemptionTransaction(
            memberResult.data.memberId,
            points, 
            productName
        );
        
        if (transactionResult.success) {
            alert(`¡Producto canjeado exitosamente!\n\nProducto: ${productName}\nPuntos utilizados: ${(points * 100).toLocaleString()}\nTransacción: ${transactionResult.data.transactionNumber}`);
            showSection('perfil');
        } else {
            alert('Error al canjear producto: ' + transactionResult.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar el canje. Intenta nuevamente.');
    } finally {
        loadingMessage.remove();
    }
}

async function createRedemptionTransaction(memberId, amount, productName) {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            operation: "createTransaction",
            data: {
                memberId: memberId,
                amount: amount,
                journalSubType: "Product",
                productName: productName,
                activityDate: new Date().toISOString().split('T')[0]
            }
        })
    });
    return await response.json();
}

async function createAccrualTransaction(memberId, amount, productName, rewardDefinitionId) {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            operation: "createTransaction",
            data: {
                memberId: memberId,
                amount: amount,
                journalSubType: "Gamification",
                productName: productName,
                rewardDefinitionId: rewardDefinitionId,
                activityDate: new Date().toISOString().split('T')[0]
            }
        })
    });
    return await response.json();
}

// ============================================
// REDENCIÓN DE VOUCHERS
// ============================================
async function redeemVoucher() {
    const voucherCode = document.getElementById('voucherCode').value.trim().toUpperCase();
    const membershipNumber = document.getElementById('voucherMembershipNumber').value.trim();
    const voucherLoading = document.getElementById('voucherLoading');
    const voucherMessage = document.getElementById('voucherMessage');
    const voucherResult = document.getElementById('voucherResult');
    
    if (!voucherCode) {
        showVoucherMessage('Por favor, ingresa el código de voucher', 'error');
        return;
    }
    
    if (!membershipNumber) {
        showVoucherMessage('Por favor, ingresa tu número de membresía', 'error');
        return;
    }
    
    voucherLoading.classList.add('show');
    voucherMessage.classList.remove('show');
    voucherResult.style.display = 'none';
    
    try {
        const memberResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getMember",
                data: { membershipNumber }
            })
        });
        
        const memberResult = await memberResponse.json();
        
        if (!memberResult.success) {
            showVoucherMessage('Miembro no encontrado. Verifica tu número de membresía.', 'error');
            return;
        }
        
        const redeemResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "redeemVoucher",
                data: {
                    voucherCode: voucherCode,
                    membershipNumber: membershipNumber
                }
            })
        });
        
        const redeemResult = await redeemResponse.json();
        
        if (redeemResult.success) {
            displayVoucherResult(redeemResult.data);
            document.getElementById('voucherCode').value = '';
            document.getElementById('voucherMembershipNumber').value = '';
        } else {
            showVoucherMessage(redeemResult.error || 'Error al redimir voucher', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showVoucherMessage('Error al procesar la redención. Intenta nuevamente.', 'error');
    } finally {
        voucherLoading.classList.remove('show');
    }
}

function displayVoucherResult(voucherData) {
    document.getElementById('redeemedCode').textContent = voucherData.voucherCode;
    document.getElementById('redeemedType').textContent = voucherData.type || 'Descuento';
    document.getElementById('redeemedValue').textContent = voucherData.value || '10% OFF';
    
    if (voucherData.expirationDate) {
        const expiryDate = new Date(voucherData.expirationDate);
        document.getElementById('redeemedExpiry').textContent = expiryDate.toLocaleDateString('es-ES');
    } else {
        document.getElementById('redeemedExpiry').textContent = 'Sin límite';
    }
    
    document.getElementById('voucherResult').style.display = 'block';
    document.getElementById('voucherResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetVoucherForm() {
    document.getElementById('voucherCode').value = '';
    document.getElementById('voucherMembershipNumber').value = '';
    document.getElementById('voucherResult').style.display = 'none';
    document.getElementById('voucherCode').focus();
}

async function loadActiveVouchers(membershipNumber) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getActiveVouchers",
                data: { membershipNumber }
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data.vouchers.length > 0) {
            const vouchersList = document.getElementById('vouchersList');
            vouchersList.innerHTML = '';
            
            result.data.vouchers.forEach(voucher => {
                const voucherCard = document.createElement('div');
                voucherCard.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; box-shadow: 0 5px 20px rgba(0,0,0,0.2);';
                voucherCard.innerHTML = `
                    <div style="font-size: 14px; opacity: 0.8; margin-bottom: 10px;">${voucher.type}</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">${voucher.value}</div>
                    <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; font-family: monospace;">
                        ${voucher.code}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8; margin-top: 10px;">
                        Válido hasta: ${new Date(voucher.expirationDate).toLocaleDateString('es-ES')}
                    </div>
                `;
                vouchersList.appendChild(voucherCard);
            });
            
            document.getElementById('activeVouchers').style.display = 'block';
        }
    } catch (error) {
        console.error('Error cargando vouchers activos:', error);
    }
}
// ============================================
// COMPRA DE PRODUCTOS CON DINERO
// ============================================
async function purchaseProduct(productName, price, pointsToEarn) {
    const membershipNumber = prompt('Ingresa tu número de membresía para completar la compra:');
    
    if (!membershipNumber) {
        alert('Debes ingresar tu número de membresía para continuar');
        return;
    }
    
    if (!confirm(`¿Deseas comprar ${productName} por €${price}?\n\nGanarás ${pointsToEarn.toLocaleString()} puntos automáticamente.`)) {
        return;
    }
    
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading show';
    loadingMessage.innerHTML = '<div class="spinner"></div><p>Procesando compra...</p>';
    document.querySelector('#tienda').appendChild(loadingMessage);
    
    try {
        // Verificar que el miembro existe
        const memberResponse = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: "getMember",
                data: { membershipNumber: membershipNumber }
            })
        });
        
        const memberResult = await memberResponse.json();
        
        if (!memberResult.success) {
            alert('Miembro no encontrado. Verifica tu número de membresía.');
            return;
        }
        
        // Crear transacción de compra (Accrual Purchase)
        const purchaseResult = await createPurchaseTransaction(
            memberResult.data.memberId,
            pointsToEarn,
            productName,
            price
        );
        
        if (purchaseResult.success) {
            alert(`¡Compra realizada exitosamente! 🎉\n\nProducto: ${productName}\nPrecio: €${price}\nPuntos ganados: ${pointsToEarn.toLocaleString()}\nTransacción: ${purchaseResult.data.transactionNumber}\n\n¡Gracias por tu compra!`);
            
            // Opcional: Redirigir al perfil para ver los puntos actualizados
            setTimeout(() => {
                document.getElementById('searchInput').value = membershipNumber;
                showSection('perfil');
                searchProfile();
            }, 1000);
        } else {
            alert('Error al procesar la compra: ' + purchaseResult.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la compra. Intenta nuevamente.');
    } finally {
        loadingMessage.remove();
    }
}

async function createPurchaseTransaction(memberId, pointsToEarn, productName, price) {
    const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            operation: "createTransaction",
            data: {
                memberId: memberId,
                amount: pointsToEarn, // Puntos que se acreditarán
                journalSubType: "Purchase",
                productName: productName,
                transactionAmount: price, // Precio real del producto
                activityDate: new Date().toISOString().split('T')[0]
            }
        })
    });
    return await response.json();
}

function showVoucherMessage(text, type) {
    const voucherMessage = document.getElementById('voucherMessage');
    voucherMessage.textContent = text;
    voucherMessage.className = `message ${type} show`;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function generateMembershipNumber() {
    const prefix = 'LM';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
}

function showProfileMessage(text, type) {
    const profileMessage = document.getElementById('profileMessage');
    profileMessage.textContent = text;
    profileMessage.className = `message ${type} show`;
}

function showWheelLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type} show`;
}
