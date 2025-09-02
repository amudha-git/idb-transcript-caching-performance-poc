# 🚀 Transcript Caching - Storage Performance POC

A comprehensive performance comparison of different IndexedDB storage approaches for chat applications, demonstrating the trade-offs between single-store vs. two-store architectures and main thread vs. web worker implementations.

## 🎯 **Project Overview**

This POC compares four different IndexedDB storage strategies to help developers choose the optimal approach for chat/messaging applications:

- **Way 1**: Single Store (Main Thread)
- **Way 2**: Two Stores (Main Thread) 
- **Way 3**: Single Store + Web Worker
- **Way 4**: Two Stores + Web Worker
- **Way 5**: One Store per Chat (Not Recommended - Technical Limitations)

## 🏗️ **Architecture Approaches**

### **Way 1: Single Store (Main Thread)**
- One store with `chatId` as key and map of message objects as value
- Each message object has `msguid` as key and contains full message data
- All operations run on the main thread

### **Way 2: Two Stores (Main Thread)**
- **Transcript Store**: `chid` vs `msguid` map
- **Message Store**: `msguid` vs message object with composite index `['chid', 'meta.msguid']`
- All operations run on the main thread

### **Way 3: Single Store + Web Worker**
- Same as Way 1 but all IDB operations go through Web Worker
- Offloads database operations from main thread

### **Way 4: Two Stores + Web Worker**
- Same as Way 2 but all IDB operations go through Web Worker
- Combines two-store architecture with web worker benefits

### **Way 5: One Store per Chat (Not Recommended)**
- Creates a new store for each chat
- **Not implemented due to technical limitations:**
  - Version upgrade required for each new chat
  - Tab blocking during upgrades
  - Performance overhead with many stores
  - Maintenance complexity

## 📊 **Performance Metrics**

The POC measures and compares:

- **Bulk Add Message**: Adding multiple messages at once
- **Single Add Message**: Adding individual messages
- **Bulk Update Message**: Updating multiple messages
- **Single Update Message**: Updating individual messages
- **Single Delete Message**: Deleting individual messages
- **Get Chat Messages**: Retrieving messages using message IDs
- **Get Chat Messages By Index Range**: Using composite index for efficient retrieval
- **Check Message Exists**: Verifying message existence

## 🎨 **Features**

- **Real-time Performance Testing**: Automated testing of all approaches
- **Interactive Charts**: Visual comparison using Chart.js
- **Winner Comparison Tables**: Clear performance winners for each category
- **Main Thread vs. Worker Thread Analysis**: Separate metrics for UI responsiveness
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 **Getting Started**

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd idb_poc
   ```

2. **Open in browser**
   - Simply open `public/index.html` in any modern browser
   - No build process or dependencies required

3. **Run Performance Tests**
   - Configure test parameters (number of chats, messages, etc.)
   - Click "Run Performance Test" to start comparison
   - View results in charts and tables

## 🔧 **Technical Details**

- **Pure HTML/CSS/JavaScript**: No frameworks or build tools
- **IndexedDB**: Modern browser database API
- **Web Workers**: Background thread processing
- **Chart.js**: Data visualization
- **Composite Indexes**: Efficient range queries

## 📈 **Key Findings**

- **Two-store architecture** provides better performance for large datasets
- **Web Workers** improve UI responsiveness by offloading database operations
- **Composite indexes** enable efficient range queries for recent messages
- **Main thread blocking** is significantly reduced with web workers

## 🌐 **Browser Support**

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## 📝 **Usage**

1. **Configure Test Parameters**
   - Set number of chats to create
   - Set number of messages per chat
   - Set messages to load per chat
   - Choose whether to clear previous databases

2. **Run Tests**
   - Click "Run Performance Test"
   - Watch real-time progress
   - View comprehensive results

3. **Analyze Results**
   - Performance comparison charts
   - Winner comparison tables
   - Detailed timing breakdowns

## 🤝 **Contributing**

This is a POC project. Feel free to:
- Report issues
- Suggest improvements
- Fork and experiment
- Share with your team

## 📄 **License**

This project is open source and available under the MIT License.

---

**Built with ❤️ for IndexedDB performance optimization**

