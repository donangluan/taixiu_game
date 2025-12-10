document.addEventListener('DOMContentLoaded', () => {
    // === CÁC PHẦN TỬ GIAO DIỆN ===
    const rollButton = document.getElementById('rollButton');
    const diceElements = document.querySelectorAll('.dice');
    const outcomeDisplay = document.getElementById('outcome');
    const totalScoreDisplay = document.getElementById('totalScore');
    const placeBetButtons = document.querySelectorAll('.place-bet-button');
    const currentBetDisplay = document.querySelector('.current-bet');
    const balanceDisplay = document.getElementById('playerBalance'); 
    const historyDisplay = document.getElementById('historyDisplay'); 
    const countdownDisplay = document.getElementById('countdownDisplay'); 
    
    // === CÁC BIẾN QUẢN LÝ VỐN VÀ GIỚI HẠN ===
    const initialBalance = 5000000; // Vốn ban đầu (5 triệu VNĐ)
    const profitLimit = 2000000;    // Giới hạn lợi nhuận (2 triệu VNĐ)
    const MAX_BALANCE = initialBalance + profitLimit; // Tối đa 7 triệu
    const MAX_HISTORY = 10; // Giới hạn số lượng kết quả hiển thị

    // === LOGIC GIAN LẬN TINH TẾ (Cần thay đổi tùy theo chiến lược) ===
    const CHEAT_THRESHOLD_RATIO = 0.5; // Ngưỡng cược lớn (50% vốn ban đầu = 2.5 triệu)
    const CHEAT_THRESHOLD = initialBalance * CHEAT_THRESHOLD_RATIO; 
    const CHEAT_PROBABILITY = 0.7; // 70% cơ hội gian lận khi vượt ngưỡng cược lớn

    // === BIẾN TRẠNG THÁI VÀ THỜI GIAN ===
    const COUNTDOWN_TIME = 30; 
    let timerInterval = null;
    let timeRemaining = COUNTDOWN_TIME;
    let bettingAllowed = false; 

    let playerBalance = initialBalance; 
    let currentBetAmount = 0;
    let currentBetType = null; 
    let historyResults = []; 

    // === CÁC HÀM CƠ BẢN ===

    const rollDice = () => Math.floor(Math.random() * 6) + 1;

    const updateBalanceDisplay = () => {
        balanceDisplay.textContent = `${playerBalance.toLocaleString('vi-VN')}`;
    };
    
    const updateHistory = (resultType) => {
        if (resultType) { 
            historyResults.unshift(resultType); 
        }
        if (historyResults.length > MAX_HISTORY) {
            historyResults.pop(); 
        }

        historyDisplay.innerHTML = ''; 
        historyResults.forEach(result => {
            const item = document.createElement('div');
            item.className = `history-item ${result}`; 
            item.textContent = result.charAt(0);
            historyDisplay.appendChild(item);
        });
    };
    
    // ===============================================
    // HÀM QUẢN LÝ THỜI GIAN VÀ VÒNG CHƠI MỚI
    // ===============================================

    const runCountdown = () => {
        timeRemaining = COUNTDOWN_TIME;
        bettingAllowed = true;
        countdownDisplay.textContent = timeRemaining;
        
        rollButton.disabled = true; 
        placeBetButtons.forEach(btn => btn.disabled = false); 
        outcomeDisplay.textContent = "Bắt đầu vòng mới! Vui lòng đặt cược.";

        timerInterval = setInterval(() => {
            timeRemaining--;
            countdownDisplay.textContent = timeRemaining;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                bettingAllowed = false;
                placeBetButtons.forEach(btn => btn.disabled = true); 
                
                if (currentBetAmount > 0) {
                    outcomeDisplay.textContent = "Hết giờ đặt cược! Tự động tung xúc xắc...";
                    processRoll(); 
                } else {
                    outcomeDisplay.textContent = "Hết giờ. Không có cược nào được đặt. Bắt đầu vòng mới.";
                    setTimeout(startNewRound, 3000); 
                }
            }
        }, 1000);
    };

    const startNewRound = () => {
        currentBetAmount = 0;
        currentBetType = null;
        currentBetDisplay.textContent = `Số tiền cược hiện tại: 0 VNĐ. Đặt cược mới!`;
        rollButton.disabled = true; 
        
        runCountdown();
    };

    // ===============================================
    // HÀM TUNG XÚC XẮC VÀ XỬ LÝ KẾT QUẢ (CORE LOGIC)
    // ===============================================
    const processRoll = () => {
        
        bettingAllowed = false;
        rollButton.disabled = true;
        placeBetButtons.forEach(btn => btn.disabled = true); 

        const results = [];
        let total = 0;
        let rollResult = '';
        let message = '';
        let outcomeColor = '#f1c40f'; 

        // 1. XỬ LÝ ĐIỀU CHỈNH KẾT QUẢ (GIAN LẬN TINH TẾ)
        let forcedDiceValues = [];
        let isCheating = false;

        // A. KIỂM TRA NGƯỠNG CƯỢC LỚN
        if (currentBetAmount >= CHEAT_THRESHOLD) {
            // B. KIỂM TRA XÁC SUẤT BỊP
            if (Math.random() < CHEAT_PROBABILITY) {
                
                isCheating = true;
                
                // LOGIC BỊP: BUỘC KẾT QUẢ NGƯỢC LẠI CƯỢC
                if (currentBetType === 'XỈU') { 
                    // Cược Xỉu -> buộc ra TÀI (Tổng 13)
                    forcedDiceValues = [6, 6, 1]; 
                } 
                else if (currentBetType === 'TÀI') {
                    // Cược Tài -> buộc ra XỈU (Tổng 6)
                    forcedDiceValues = [1, 2, 3]; 
                }
            }
        }
        
        // C. TUNG NGẪU NHIÊN NẾU KHÔNG KÍCH HOẠT GIAN LẬN HOẶC CƯỢC NHỎ
        if (forcedDiceValues.length === 0) {
            for (let i = 0; i < 3; i++) {
                forcedDiceValues.push(rollDice()); 
            }
        }
        
        // Cập nhật giao diện xúc xắc và tính tổng
        diceElements.forEach((dice, index) => {
            const result = forcedDiceValues[index]; 
            results.push(result);
            total += result;
            
            dice.textContent = result;
            dice.style.transform = 'scale(1.2)';
            setTimeout(() => { dice.style.transform = 'scale(1)'; }, 100);
        });

        totalScoreDisplay.textContent = total;
        
        if (isCheating) {
             console.warn(`[CHEAT MODE] Cược lớn (${currentBetAmount.toLocaleString('vi-VN')}) kích hoạt gian lận ngược! Xác suất thành công: ${CHEAT_PROBABILITY*100}%`);
        }

        // 2. XÁC ĐỊNH KẾT QUẢ VÀ TÍNH TOÁN
        let isTriple = (results[0] === results[1] && results[1] === results[2]);

        if (isTriple) {
            rollResult = `TRIPLE`; 
            outcomeColor = '#ff6600';
            message = `THUA CƯỢC! BỘ BA ĐỒNG NHẤT (Tổng: ${total}).`; 
        } else if (total >= 11 && total <= 17) {
            rollResult = 'TÀI';
            outcomeColor = '#e74c3c';
        } else if (total >= 4 && total <= 10) {
            rollResult = 'XỈU';
            outcomeColor = '#3498db';
        }

        updateHistory(rollResult);

        // 3. KIỂM TRA GIỚI HẠN LỢI NHUẬN VÀ XỬ LÝ CƯỢC
        if (rollResult !== 'TRIPLE') {
            if (rollResult === currentBetType) {
                // THẮNG CƯỢC
                playerBalance += currentBetAmount;
                const potentialProfit = currentBetAmount; 

                if (playerBalance + potentialProfit > MAX_BALANCE) {
                    const actualProfit = MAX_BALANCE - playerBalance;
                    
                    if (actualProfit <= 0) {
                        playerBalance = MAX_BALANCE;
                        message = `GIỚI HẠN LỢI NHUẬN! Vốn cược ${currentBetAmount.toLocaleString('vi-VN')} VNĐ đã được hoàn trả, nhưng bạn không nhận thêm lợi nhuận vì đã đạt mức tối đa ${MAX_BALANCE.toLocaleString('vi-VN')} VNĐ.`;
                        outcomeColor = '#00ff00';
                    } else {
                        playerBalance += actualProfit;
                        message = `GIỚI HẠN LỢI NHUẬN! Bạn thắng, nhưng số dư đã đạt mức tối đa ${MAX_BALANCE.toLocaleString('vi-VN')} VNĐ. Bạn chỉ nhận được ${actualProfit.toLocaleString('vi-VN')} VNĐ tiền lời.`;
                        outcomeColor = '#00ff00';
                    }
                } else {
                    playerBalance += potentialProfit;
                    const winAmountTotal = currentBetAmount * 2;
                    message = `THẮNG CƯỢC! Kết quả là ${rollResult} (Tổng: ${total}). Bạn nhận lại ${winAmountTotal.toLocaleString('vi-VN')} VNĐ!`;
                    outcomeColor = '#ffcc00';
                }
            } else {
                // Thua cược
                message = `THUA CƯỢC! Kết quả là ${rollResult} (Tổng: ${total}).`;
                outcomeColor = '#999999';
            }
        }
        
        // 4. Cập nhật giao diện cuối và reset vòng chơi
        outcomeDisplay.style.color = outcomeColor;
        outcomeDisplay.textContent = message;
        updateBalanceDisplay();
        
        setTimeout(startNewRound, 5000); 
    };

    // ===============================================
    // GỌI HÀM KHỞI TẠO VÀ XỬ LÝ SỰ KIỆN
    // ===============================================

    updateBalanceDisplay();
    updateHistory(); 
    startNewRound(); 

    // Lắng nghe sự kiện Đặt Cược
    placeBetButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (!bettingAllowed || currentBetAmount > 0) {
                alert('Vòng cược đã đóng hoặc bạn đã đặt cược rồi.');
                return;
            }

            const betOptionElement = event.target.closest('.bet-option');
            const inputElement = betOptionElement.querySelector('.bet-input');
            let betAmount = Math.floor(parseFloat(inputElement.value)); 

            if (isNaN(betAmount) || betAmount <= 0 || betAmount > playerBalance) {
                alert('Vui lòng nhập số tiền cược hợp lệ và không vượt quá số dư.');
                return;
            }

            currentBetType = inputElement.getAttribute('data-bet-type');
            currentBetAmount = betAmount;
            
            playerBalance -= betAmount;
            bettingAllowed = false; // Khóa đặt cược sau cược đầu tiên

            placeBetButtons.forEach(btn => btn.disabled = true); 

            currentBetDisplay.textContent = `Đang cược: ${currentBetAmount.toLocaleString('vi-VN')} VNĐ vào cửa ${currentBetType}.`;
            updateBalanceDisplay();
            outcomeDisplay.textContent = `Đã cược ${currentBetType}. Có thể nhấn Tung Xúc Xắc hoặc chờ hết giờ.`;
            rollButton.disabled = false;
        });
    });

    // Lắng nghe sự kiện Tung Xúc Xắc (Người chơi tự động kích hoạt)
    rollButton.addEventListener('click', () => {
        if (currentBetAmount === 0) {
            alert('Vui lòng đặt cược trước khi tung xúc xắc.');
            return;
        }
        
        clearInterval(timerInterval); // Dừng đếm ngược nếu người chơi tự xóc
        
        processRoll();
    });
});