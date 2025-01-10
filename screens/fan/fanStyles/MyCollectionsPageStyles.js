import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 16 },
    scrollView: { flex: 1 },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
    noPostsText: { fontSize: 18, color: '#ffffff', textAlign: 'center', marginVertical: 20 },
    imageWrapper: { width: '48%', height: 200, marginVertical: 10 },
    image: { width: '100%', height: '100%', borderRadius: 10 },
});

export default styles;
