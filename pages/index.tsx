import dynamic from 'next/dynamic';

const FileBrowser = dynamic(() => import('../components/FileBrowser'), {
    ssr: false,
    loading: () => <div data-test-id="file-browser-container" className="flex items-center justify-center min-h-screen text-2xl font-semibold">Loading file browser...</div>
});

export default function HomePage() {
    return (
        <div>
            <FileBrowser />
        </div>
    );
}
