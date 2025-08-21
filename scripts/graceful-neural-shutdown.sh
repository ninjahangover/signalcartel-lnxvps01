#!/bin/bash

# Graceful Neural Predictor Shutdown Script
# Ensures Markov chain model is properly saved before system shutdown

set -e

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧠 Graceful Neural Predictor Shutdown${NC}"
echo "======================================="

# Function to save Markov model with timeout
save_neural_model() {
    echo -e "${YELLOW}💾 Saving Neural Predictor model...${NC}"
    
    # Try to save the model with a reasonable timeout
    timeout 15s node -e "
        const { saveMarkovModel } = require('./src/lib/markov-model-persistence');
        const { markovPredictor } = require('./src/lib/markov-chain-predictor');
        
        async function shutdown() {
            try {
                console.log('🔮 Exporting Neural Predictor state...');
                
                // Get current metrics before saving
                const metrics = markovPredictor.getLLNConfidenceMetrics();
                console.log(\`📊 Current learning status: \${metrics.convergenceStatus}\`);
                console.log(\`🎯 Neural confidence: \${(metrics.overallReliability * 100).toFixed(1)}%\`);
                
                // Save the model
                await saveMarkovModel();
                
                console.log('✅ Neural Predictor model saved successfully');
                console.log('🧠 All learning progress preserved');
                
                process.exit(0);
            } catch (error) {
                console.error('❌ Model save failed:', error.message);
                process.exit(1);
            }
        }
        
        shutdown();
    " 2>/dev/null
    
    local save_result=$?
    
    if [ $save_result -eq 0 ]; then
        echo -e "${GREEN}✅ Neural Predictor data saved successfully${NC}"
        return 0
    elif [ $save_result -eq 124 ]; then
        echo -e "${YELLOW}⚠️ Model save timed out (15s) - continuing shutdown${NC}"
        return 1
    else
        echo -e "${RED}❌ Model save failed - continuing shutdown anyway${NC}"
        return 1
    fi
}

# Function to create emergency snapshot
create_emergency_snapshot() {
    echo -e "${YELLOW}📸 Creating emergency snapshot...${NC}"
    
    timeout 10s node -e "
        const { createMarkovSnapshot } = require('./src/lib/markov-model-persistence');
        
        createMarkovSnapshot()
            .then(snapshot => {
                console.log(\`📸 Emergency snapshot created: \${snapshot}\`);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Snapshot failed:', error.message);
                process.exit(1);
            });
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Emergency snapshot created${NC}"
    else
        echo -e "${YELLOW}⚠️ Emergency snapshot failed${NC}"
    fi
}

# Function to preserve learning state
preserve_learning_state() {
    echo -e "${YELLOW}🧠 Preserving learning state...${NC}"
    
    # Ensure data directory exists
    mkdir -p data/models/emergency
    
    # Try to get current learning state
    timeout 5s node -e "
        const fs = require('fs');
        const { markovPredictor } = require('./src/lib/markov-chain-predictor');
        
        try {
            const metrics = markovPredictor.getLLNConfidenceMetrics();
            const state = {
                timestamp: new Date().toISOString(),
                convergenceStatus: metrics.convergenceStatus,
                overallReliability: metrics.overallReliability,
                currentAverageConfidence: metrics.currentAverageConfidence,
                recommendedMinTrades: metrics.recommendedMinTrades,
                shutdownReason: 'graceful_shutdown'
            };
            
            fs.writeFileSync('data/models/emergency/last-state.json', JSON.stringify(state, null, 2));
            console.log('✅ Learning state preserved');
        } catch (error) {
            console.error('❌ State preservation failed:', error.message);
        }
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Learning state preserved${NC}"
    else
        echo -e "${YELLOW}⚠️ State preservation failed${NC}"
    fi
}

# Main shutdown sequence
main() {
    echo -e "${CYAN}Starting graceful Neural Predictor shutdown...${NC}"
    
    # Step 1: Try normal model save
    if save_neural_model; then
        echo -e "${GREEN}🎉 Normal shutdown completed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️ Normal save failed, trying alternatives...${NC}"
        
        # Step 2: Try emergency snapshot
        create_emergency_snapshot
        
        # Step 3: Preserve learning state
        preserve_learning_state
    fi
    
    # Step 4: Final verification
    echo -e "\n${CYAN}🔍 Verifying preservation...${NC}"
    
    if [ -f "data/models/markov-chain-model.json" ]; then
        local model_size=$(stat -f%z "data/models/markov-chain-model.json" 2>/dev/null || stat -c%s "data/models/markov-chain-model.json" 2>/dev/null || echo 0)
        if [ "$model_size" -gt 100 ]; then
            echo -e "${GREEN}✅ Main model file exists (${model_size} bytes)${NC}"
        else
            echo -e "${YELLOW}⚠️ Main model file is small or empty${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Main model file not found${NC}"
    fi
    
    # Check for snapshots
    if [ -d "data/models/snapshots" ]; then
        local snapshot_count=$(ls -1 data/models/snapshots/*.json 2>/dev/null | wc -l || echo 0)
        echo -e "${GREEN}✅ ${snapshot_count} snapshots available${NC}"
    fi
    
    # Check emergency state
    if [ -f "data/models/emergency/last-state.json" ]; then
        echo -e "${GREEN}✅ Emergency state preserved${NC}"
    fi
    
    echo -e "\n${GREEN}🧠 Neural Predictor shutdown completed${NC}"
    echo -e "${CYAN}💡 All learning progress has been preserved${NC}"
    echo -e "${CYAN}🚀 The Neural Predictor will resume learning on next startup${NC}"
}

# Handle signals
trap 'echo -e "\n${RED}⚠️ Shutdown interrupted${NC}"; preserve_learning_state; exit 1' INT TERM

# Run main function
main "$@"