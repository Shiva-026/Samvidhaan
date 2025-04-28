document.addEventListener('DOMContentLoaded', function() {
    // Wheel configuration
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const spinButton = document.getElementById('spinButton');
    const resultContainer = document.getElementById('resultContainer');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const explanationText = document.getElementById('explanationText');
    const nextButton = document.getElementById('nextButton');
    const scoreDisplay = document.getElementById('scoreDisplay');
    
    // Game state
    let isSpinning = false;
    let currentAngle = 0;
    let score = 0;
    let spinCount = 0;
    const maxSpins = 5;
    
    // Topics
    const topics = [
        "Fundamental Rights",
        "Directive Principles",
        "Fundamental Duties",
        "President",
        "Parliament",
        "Judiciary",
        "Amendments",
        "Emergency Provisions"
    ];
    
    // Draw the wheel
    function drawWheel() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const segmentAngle = (2 * Math.PI) / topics.length;
        
        for (let i = 0; i < topics.length; i++) {
            const startAngle = i * segmentAngle + currentAngle;
            const endAngle = (i + 1) * segmentAngle + currentAngle;
            
            ctx.fillStyle = i % 2 === 0 ? '#4a5568' : '#2d3748';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(topics[i], radius - 20, 5);
            ctx.restore();
        }
        
        ctx.fillStyle = '#e53e3e';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Initialize
    drawWheel();
    spinButton.textContent = `Spin (0/${maxSpins})`;
    
    // Spin button event listener
    spinButton.addEventListener('click', function() {
        if (!isSpinning && spinCount < maxSpins) {
            spinWheel();
        }
    });
    
    // Next button event listener
    nextButton.addEventListener('click', function() {
        resultContainer.style.display = 'none';
        if (spinCount < maxSpins) {
            spinButton.disabled = false;
        }
    });

    function spinWheel() {
        isSpinning = true;
        spinCount++;
        spinButton.disabled = true;
        
        const spinDuration = 3000 + Math.random() * 2000;
        const startTime = Date.now();
        const startAngle = currentAngle;
        const spinAngle = 10 + Math.random() * 20;
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
            
            currentAngle = startAngle + easeProgress * spinAngle * Math.PI * 2;
            drawWheel();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                finishSpin();
            }
        }
        
        animate();
    }
    
    function finishSpin() {
        isSpinning = false;
        const segmentAngle = (2 * Math.PI) / topics.length;
        const normalizedAngle = ((currentAngle % (2 * Math.PI)) + (2 * Math.PI));
        const adjustedAngle = normalizedAngle % (2 * Math.PI);
        const selectedSegment = Math.floor(adjustedAngle / segmentAngle);
        const selectedTopic = topics[topics.length - 1 - selectedSegment];
        
        // For now, just display the selected topic
        displayQuestion({
            question: `Selected Topic: ${selectedTopic}`,
            options: ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctAnswer: 0,
            explanation: "This is a placeholder for the real questions which will be implemented next."
        });
        
        if (spinCount >= maxSpins) {
            spinButton.textContent = "Game Over";
            setTimeout(showFinalScore, 1000);
        } else {
            spinButton.textContent = `Spin (${spinCount}/${maxSpins})`;
        }
    }
    
    function displayQuestion(questionData) {
        questionText.textContent = questionData.question;
        optionsContainer.innerHTML = '';
        
        questionData.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => checkAnswer(index, questionData.correctAnswer, optionElement));
            optionsContainer.appendChild(optionElement);
        });
        
        explanationText.textContent = '';
        resultContainer.style.display = 'block';
        nextButton.style.display = 'none';
    }
    
    function checkAnswer(selectedIndex, correctIndex, optionElement) {
        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.style.pointerEvents = 'none';
        });
        
        if (selectedIndex === correctIndex) {
            optionElement.classList.add('correct');
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        } else {
            optionElement.classList.add('incorrect');
            options[correctIndex].classList.add('correct');
        }
        
        explanationText.textContent = questionData.explanation;
        nextButton.style.display = 'block';
    }
    
    function showFinalScore() {
        resultContainer.style.display = 'block';
        questionText.textContent = `Game Over! Your final score is ${score} out of ${maxSpins}`;
        optionsContainer.innerHTML = '';
        explanationText.textContent = 'Thank you for playing!';
        nextButton.style.display = 'none';
    }
});