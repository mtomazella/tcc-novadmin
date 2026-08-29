const Header = ((props: { Title: string; }) => {
  return (
      <header className="bg-white shadow">
        <div className="max-w-[90vw] mx-auto px-3 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-2xl lg:text-3xl font-bold text-gray-900">{props.Title}</h1>
        </div>
      </header>
  );
});

export default Header;