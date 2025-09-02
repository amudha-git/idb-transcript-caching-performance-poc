const { v4: uuidv4 } = require('uuid');

// Since we're running in Node.js, we need to mock IndexedDB
// In a real browser environment, these would be the actual IndexedDB implementations
class MockIndexedDB {
    constructor() {
        this.databases = new Map();
    }

    open(dbName, version) {
        const request = {
            result: null,
            error: null,
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null
        };

        setTimeout(() => {
            if (!this.databases.has(dbName)) {
                this.databases.set(dbName, {
                    name: dbName,
                    version: version,
                    objectStores: new Map()
                });
            }

            const db = this.databases.get(dbName);
            request.result = {
                objectStoreNames: {
                    contains: (name) => db.objectStores.has(name)
                },
                createObjectStore: (name, options) => {
                    const store = {
                        name,
                        keyPath: options?.keyPath,
                        data: new Map(),
                        indexes: new Map()
                    };
                    db.objectStores.set(name, store);
                    return {
                        createIndex: (indexName, keyPath, options) => {
                            store.indexes.set(indexName, { keyPath, unique: options?.unique || false });
                        }
                    };
                },
                transaction: (storeNames, mode) => {
                    const transaction = {
                        objectStore: (name) => {
                            const store = db.objectStores.get(name);
                            if (!store) {
                                throw new Error(`Store ${name} not found`);
                            }
                            return {
                                get: (key) => {
                                    const getRequest = { result: null, error: null, onsuccess: null, onerror: null };
                                    setTimeout(() => {
                                        getRequest.result = store.data.get(key);
                                        if (getRequest.onsuccess) getRequest.onsuccess();
                                    }, 0);
                                    return getRequest;
                                },
                                put: (value) => {
                                    const putRequest = { result: null, error: null, onsuccess: null, onerror: null };
                                    setTimeout(() => {
                                        store.data.set(value[store.keyPath], value);
                                        if (putRequest.onsuccess) putRequest.onsuccess();
                                    }, 0);
                                    return putRequest;
                                },
                                delete: (key) => {
                                    const deleteRequest = { result: null, error: null, onsuccess: null, onerror: null };
                                    setTimeout(() => {
                                        store.data.delete(key);
                                        if (deleteRequest.onsuccess) deleteRequest.onsuccess();
                                    }, 0);
                                    return deleteRequest;
                                },
                                getAll: () => {
                                    const getAllRequest = { result: null, error: null, onsuccess: null, onerror: null };
                                    setTimeout(() => {
                                        getAllRequest.result = Array.from(store.data.values());
                                        if (getAllRequest.onsuccess) getAllRequest.onsuccess();
                                    }, 0);
                                    return getAllRequest;
                                }
                            };
                        }
                    };
                    return transaction;
                },
                close: () => {
                    // Mock close
                }
            };

            if (request.onupgradeneeded) {
                request.onupgradeneeded({ target: { result: request.result } });
            }
            if (request.onsuccess) {
                request.onsuccess();
            }
        }, 0);

        return request;
    }
}

// Mock indexedDB for Node.js environment
global.indexedDB = new MockIndexedDB();

const Way1SingleStore = require('./storage/way1-single-store');
const Way2TwoStores = require('./storage/way2-two-stores');
const Way3SeparateDBs = require('./storage/way3-separate-dbs');

class ChatStorageBenchmark {
    constructor() {
        this.way1 = new Way1SingleStore();
        this.way2 = new Way2TwoStores();
        this.way3 = new Way3SeparateDBs();
        this.results = {
            way1: {},
            way2: {},
            way3: {}
        };
    }

    async initialize() {
        console.log('🚀 Initializing Chat Storage Benchmark...');
        await this.way1.initialize();
        await this.way2.initialize();
        await this.way3.initialize();
        console.log('✅ All storage systems initialized');
    }

    generateTestData(numChats = 10, messagesPerChat = 100) {
        const testData = [];
        
        for (let i = 0; i < numChats; i++) {
            const chatId = `chat-${i + 1}`;
            const chatMessages = [];
            
            for (let j = 0; j < messagesPerChat; j++) {
                chatMessages.push({
                    id: uuidv4(),
                    content: `Message ${j + 1} in chat ${i + 1} - ${Math.random().toString(36).substring(7)}`,
                    sender: `user-${Math.floor(Math.random() * 5) + 1}`,
                    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    type: 'text'
                });
            }
            
            testData.push({ chatId, messages: chatMessages });
        }
        
        return testData;
    }

    async benchmarkAddMessages(testData) {
        console.log('\n📝 Benchmarking: Add Messages');
        
        for (const way of ['way1', 'way2', 'way3']) {
            console.log(`\nTesting ${way.toUpperCase()}...`);
            const store = this[way];
            const durations = [];
            
            for (const { chatId, messages } of testData) {
                for (const message of messages) {
                    const result = await store.addMessage(chatId, message);
                    if (result.success) {
                        durations.push(result.duration);
                    }
                }
            }
            
            this.results[way].addMessage = {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: durations.reduce((a, b) => a + b, 0),
                count: durations.length
            };
            
            console.log(`✅ ${way}: Avg ${this.results[way].addMessage.average.toFixed(2)}ms`);
        }
    }

    async benchmarkReadMessages(testData) {
        console.log('\n📖 Benchmarking: Read Messages (60 messages per chat)');
        
        for (const way of ['way1', 'way2', 'way3']) {
            console.log(`\nTesting ${way.toUpperCase()}...`);
            const store = this[way];
            const durations = [];
            
            for (const { chatId } of testData) {
                const result = await store.getChatMessages(chatId, 60);
                if (result.success) {
                    durations.push(result.duration);
                }
            }
            
            this.results[way].readMessages = {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: durations.reduce((a, b) => a + b, 0),
                count: durations.length
            };
            
            console.log(`✅ ${way}: Avg ${this.results[way].readMessages.average.toFixed(2)}ms`);
        }
    }

    async benchmarkEditMessages(testData) {
        console.log('\n✏️ Benchmarking: Edit Messages');
        
        for (const way of ['way1', 'way2', 'way3']) {
            console.log(`\nTesting ${way.toUpperCase()}...`);
            const store = this[way];
            const durations = [];
            
            for (const { chatId, messages } of testData) {
                // Edit first 10 messages in each chat
                for (let i = 0; i < Math.min(10, messages.length); i++) {
                    const message = messages[i];
                    const result = await store.editMessage(chatId, message.id, `EDITED: ${message.content}`);
                    if (result.success) {
                        durations.push(result.duration);
                    }
                }
            }
            
            this.results[way].editMessage = {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: durations.reduce((a, b) => a + b, 0),
                count: durations.length
            };
            
            console.log(`✅ ${way}: Avg ${this.results[way].editMessage.average.toFixed(2)}ms`);
        }
    }

    async benchmarkDeleteMessages(testData) {
        console.log('\n🗑️ Benchmarking: Delete Messages');
        
        for (const way of ['way1', 'way2', 'way3']) {
            console.log(`\nTesting ${way.toUpperCase()}...`);
            const store = this[way];
            const durations = [];
            
            for (const { chatId, messages } of testData) {
                // Delete last 5 messages in each chat
                for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
                    const message = messages[i];
                    const result = await store.deleteMessage(chatId, message.id);
                    if (result.success) {
                        durations.push(result.duration);
                    }
                }
            }
            
            this.results[way].deleteMessage = {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: durations.reduce((a, b) => a + b, 0),
                count: durations.length
            };
            
            console.log(`✅ ${way}: Avg ${this.results[way].deleteMessage.average.toFixed(2)}ms`);
        }
    }

    async benchmarkConcurrentReads(testData, concurrentUsers = 50) {
        console.log(`\n👥 Benchmarking: Concurrent Reads (${concurrentUsers} users)`);
        
        for (const way of ['way1', 'way2', 'way3']) {
            console.log(`\nTesting ${way.toUpperCase()}...`);
            const store = this[way];
            const durations = [];
            
            const promises = [];
            for (let i = 0; i < concurrentUsers; i++) {
                const chatId = testData[i % testData.length].chatId;
                promises.push(
                    store.getChatMessages(chatId, 60).then(result => {
                        if (result.success) {
                            durations.push(result.duration);
                        }
                    })
                );
            }
            
            await Promise.all(promises);
            
            this.results[way].concurrentReads = {
                average: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: durations.reduce((a, b) => a + b, 0),
                count: durations.length
            };
            
            console.log(`✅ ${way}: Avg ${this.results[way].concurrentReads.average.toFixed(2)}ms`);
        }
    }

    async getStorageStats() {
        console.log('\n📊 Getting Storage Statistics...');
        
        for (const way of ['way1', 'way2', 'way3']) {
            const store = this[way];
            const stats = await store.getStats();
            this.results[way].stats = stats;
            console.log(`${way.toUpperCase()}: ${JSON.stringify(stats, null, 2)}`);
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📈 PERFORMANCE BENCHMARK REPORT');
        console.log('='.repeat(80));
        
        const operations = ['addMessage', 'readMessages', 'editMessage', 'deleteMessage', 'concurrentReads'];
        
        for (const operation of operations) {
            console.log(`\n${operation.toUpperCase()}:`);
            console.log('-'.repeat(40));
            
            const results = [];
            for (const way of ['way1', 'way2', 'way3']) {
                if (this.results[way][operation]) {
                    results.push({
                        way,
                        avg: this.results[way][operation].average,
                        min: this.results[way][operation].min,
                        max: this.results[way][operation].max
                    });
                }
            }
            
            // Sort by average performance (lower is better)
            results.sort((a, b) => a.avg - b.avg);
            
            results.forEach((result, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                console.log(`${medal} ${result.way.toUpperCase()}: ${result.avg.toFixed(2)}ms (min: ${result.min.toFixed(2)}ms, max: ${result.max.toFixed(2)}ms)`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 RECOMMENDATIONS');
        console.log('='.repeat(80));
        
        // Analyze results and provide recommendations
        const recommendations = this.analyzeResults();
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }

    analyzeResults() {
        const recommendations = [];
        
        // Find best performer for each operation
        const operations = ['addMessage', 'readMessages', 'editMessage', 'deleteMessage', 'concurrentReads'];
        const winners = {};
        
        operations.forEach(op => {
            const results = [];
            for (const way of ['way1', 'way2', 'way3']) {
                if (this.results[way][op]) {
                    results.push({ way, avg: this.results[way][op].average });
                }
            }
            results.sort((a, b) => a.avg - b.avg);
            winners[op] = results[0].way;
        });
        
        // Overall winner
        const overallScores = {};
        for (const way of ['way1', 'way2', 'way3']) {
            let score = 0;
            operations.forEach(op => {
                if (this.results[way][op]) {
                    score += this.results[way][op].average;
                }
            });
            overallScores[way] = score;
        }
        
        const overallWinner = Object.entries(overallScores).sort((a, b) => a[1] - b[1])[0][0];
        
        recommendations.push(`Overall Best Performance: ${overallWinner.toUpperCase()} - Best for general use cases`);
        recommendations.push(`Best for Reading Messages: ${winners.readMessages.toUpperCase()} - Fastest chat loading`);
        recommendations.push(`Best for Adding Messages: ${winners.addMessage.toUpperCase()} - Fastest message creation`);
        recommendations.push(`Best for Concurrent Access: ${winners.concurrentReads.toUpperCase()} - Best for high-traffic scenarios`);
        
        return recommendations;
    }

    async runFullBenchmark(numChats = 10, messagesPerChat = 100) {
        console.log(`🚀 Starting Full Benchmark: ${numChats} chats, ${messagesPerChat} messages per chat`);
        
        const testData = this.generateTestData(numChats, messagesPerChat);
        
        await this.benchmarkAddMessages(testData);
        await this.benchmarkReadMessages(testData);
        await this.benchmarkEditMessages(testData);
        await this.benchmarkDeleteMessages(testData);
        await this.benchmarkConcurrentReads(testData);
        await this.getStorageStats();
        
        this.generateReport();
        
        return this.results;
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        await this.way1.close();
        await this.way2.close();
        await this.way3.close();
        console.log('✅ Cleanup complete');
    }
}

// Run benchmark if called directly
if (require.main === module) {
    const benchmark = new ChatStorageBenchmark();
    
    async function run() {
        try {
            await benchmark.initialize();
            await benchmark.runFullBenchmark(10, 100); // 10 chats, 100 messages each
        } catch (error) {
            console.error('Benchmark failed:', error);
        } finally {
            await benchmark.cleanup();
        }
    }
    
    run();
}

module.exports = ChatStorageBenchmark;
