import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiClient } from '../../services';

import toast from 'react-hot-toast';
import { IMAGES } from '../../config/constants';

export const normalizeKey = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

// Pre-seeded relations for prominent historical figures (mapped by slug or name)
export const HISTORICAL_MOCK_RELATIONS = {
  'le-loi': {
    parents: [
      { name: 'Lê Khoáng', relation: 'Cha (Nội)' },
      { name: 'Trịnh Thị Ngọc Thương', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [
      { name: 'Lê Đinh', relation: 'Cha' },
      { name: 'Nguyễn Thị Ngọc Huy', relation: 'Mẹ' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Lê Học', relation: 'Anh trai' },
      { name: 'Lê Trừ', relation: 'Anh trai' }
    ],
    family: [
      { name: 'Phạm Thị Ngọc Trần', relation: 'Vợ (Thần phi)' },
      { name: 'Trịnh Thị Ngọc Lữ', relation: 'Vợ' },
      { name: 'Lê Thái Tông', relation: 'Con trai' },
      { name: 'Lê Tư Tề', relation: 'Con trai' },
      { name: 'Nguyễn Thị Anh', relation: 'Con dâu (Vợ của Lê Thái Tông)' },
      { name: 'Ngô Thị Ngọc Dao', relation: 'Con dâu (Vợ của Lê Thái Tông)' }
    ]
  },
  'le-thai-tong': {
    parents: [
      { name: 'Lê Lợi', relation: 'Cha (Nội)' },
      { name: 'Phạm Thị Ngọc Trần', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [
      { name: 'Lê Khoáng', relation: 'Cha' },
      { name: 'Trịnh Thị Ngọc Thương', relation: 'Mẹ' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Lê Tư Tề', relation: 'Anh trai' }
    ],
    family: [
      { name: 'Nguyễn Thị Anh', relation: 'Vợ (Tuyên Từ hoàng hậu)' },
      { name: 'Ngô Thị Ngọc Dao', relation: 'Vợ (Quang Thục hoàng hậu)' },
      { name: 'Lê Nhân Tông', relation: 'Con trai (Lê Bang Cơ)' },
      { name: 'Lê Thánh Tông', relation: 'Con trai (Lê Tư Thành)' },
      { name: 'Trần Thị Ngọc Huyên', relation: 'Con dâu (Vợ của Lê Thánh Tông)' }
    ]
  },
  'le-nhan-tong': {
    parents: [
      { name: 'Lê Thái Tông', relation: 'Cha (Nội)' },
      { name: 'Nguyễn Thị Anh', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [
      { name: 'Lê Lợi', relation: 'Cha' },
      { name: 'Phạm Thị Ngọc Trần', relation: 'Mẹ' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Lê Thánh Tông', relation: 'Em trai' },
      { name: 'Lê Nghi Dân', relation: 'Anh trai' }
    ],
    family: []
  },
  'le-thanh-tong': {
    parents: [
      { name: 'Lê Thái Tông', relation: 'Cha (Nội)' },
      { name: 'Ngô Thị Ngọc Dao', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [
      { name: 'Lê Lợi', relation: 'Cha' },
      { name: 'Phạm Thị Ngọc Trần', relation: 'Mẹ' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Lê Nhân Tông', relation: 'Anh trai' },
      { name: 'Lê Nghi Dân', relation: 'Anh trai' }
    ],
    family: [
      { name: 'Trần Thị Ngọc Huyên', relation: 'Vợ (Trường Lạc hoàng hậu)' },
      { name: 'Lê Hiến Tông', relation: 'Con trai' }
    ]
  },
  'nguyen-trai': {
    parents: [
      { name: 'Nguyễn Phi Khanh', relation: 'Cha (Nội)' },
      { name: 'Trần Thị Thái', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [
      { name: 'Trần Nguyên Đán', relation: 'Cha' }
    ],
    siblings: [
      { name: 'Nguyễn Phi Báo', relation: 'Anh em' },
      { name: 'Nguyễn Phi Ly', relation: 'Anh em' }
    ],
    family: [
      { name: 'Nguyễn Thị Lộ', relation: 'Thiếp' },
      { name: 'Nguyễn Anh Vũ', relation: 'Con trai' }
    ]
  },
  'trung-trac': {
    parents: [
      { name: 'Hùng Định', relation: 'Cha (Nội)' },
      { name: 'Trần Thị Đoan', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [
      { name: 'Trưng Nhị', relation: 'Em gái' }
    ],
    family: [
      { name: 'Thi Sách', relation: 'Chồng' }
    ]
  },
  'trung-nhi': {
    parents: [
      { name: 'Hùng Định', relation: 'Cha (Nội)' },
      { name: 'Trần Thị Đoan', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [
      { name: 'Trưng Trắc', relation: 'Chị gái' }
    ],
    family: [
      { name: 'Thi Sách', relation: 'Anh rể' }
    ]
  },
  'dinh-bo-linh': {
    parents: [
      { name: 'Đinh Công Trứ', relation: 'Cha (Nội)' },
      { name: 'Đàm Thị', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [],
    family: [
      { name: 'Nguyễn Thị Đan', relation: 'Vợ (Đan Gia hoàng hậu)' },
      { name: 'Dương Vân Nga', relation: 'Vợ (Thứ hậu)' },
      { name: 'Đinh Liễn', relation: 'Con trai' },
      { name: 'Đinh Toàn', relation: 'Con trai (Đinh Phế Đế)' },
      { name: 'Đinh Hạng Lang', relation: 'Con trai' }
    ]
  },
  'le-hoan': {
    parents: [
      { name: 'Lê Mịch', relation: 'Cha (Nội)' },
      { name: 'Đặng Thị Sen', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [],
    family: [
      { name: 'Dương Vân Nga', relation: 'Vợ (Đại Hành hoàng hậu)' },
      { name: 'Lê Long Thâu', relation: 'Con trai' },
      { name: 'Lê Trung Tông', relation: 'Con trai (Lê Long Việt)' },
      { name: 'Lê Long Đĩnh', relation: 'Con trai (Lê Ngọa Triều)' }
    ]
  },
  'ly-thai-to': {
    parents: [
      { name: 'Lý Khánh', relation: 'Cha (Hiển Khánh Vương)' },
      { name: 'Phạm Thị Ngà', relation: 'Mẹ (Nhã Hoàng hậu)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [
      { name: 'Lý Dực', relation: 'Anh trai' }
    ],
    family: [
      { name: 'Lê Thị Phất Ngân', relation: 'Vợ (Lập Giáo hoàng hậu)' },
      { name: 'Lý Thái Tông', relation: 'Con trai (Lý Phật Mã)' }
    ]
  },
  'tran-hung-dao': {
    parents: [
      { name: 'Trần Liễu', relation: 'Cha (An Sinh Vương)' },
      { name: 'Thiện Đạo Quốc mẫu', relation: 'Mẹ' }
    ],
    paternalGrandparents: [
      { name: 'Trần Thừa', relation: 'Thái Tổ Hoàng đế' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Trần Tung', relation: 'Anh trai (Tuệ Trung Thượng Sĩ)' },
      { name: 'Trần Quốc Quốc', relation: 'Anh trai' }
    ],
    family: [
      { name: 'Thiên Thành Công chúa', relation: 'Vợ' },
      { name: 'Trần Quốc Nghiễn (Hưng Vũ Vương)', relation: 'Con trai' },
      { name: 'Trần Quốc Tảng (Hưng Nhượng Vương)', relation: 'Con trai' },
      { name: 'Trần Quốc Hiến (Hưng Trí Vương)', relation: 'Con trai' },
      { name: 'Trần Quốc Uy (Hưng Bình Vương)', relation: 'Con trai' },
      { name: 'Anh Nguyên Quận chúa', relation: 'Con gái (gả cho Phạm Ngũ Lão)' },
      { name: 'Tuyên Từ Hoàng hậu', relation: 'Con gái' }
    ]
  },
  'tran-nhan-tong': {
    parents: [
      { name: 'Trần Thánh Tông', relation: 'Cha (Nội)' },
      { name: 'Nguyên Thánh Thiên Cảm', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [
      { name: 'Trần Thái Tông', relation: 'Ông nội' },
      { name: 'Hiển Từ Thuận Thiên', relation: 'Bà nội' }
    ],
    maternalGrandparents: [],
    siblings: [
      { name: 'Trần Đức Viễn', relation: 'Anh em' },
      { name: 'Tuyên Từ Hoàng hậu', relation: 'Chị em' }
    ],
    family: [
      { name: 'Trần Thị Trinh', relation: 'Vợ (Khâm Từ hoàng hậu)' },
      { name: 'Tuyên Từ Hoàng hậu', relation: 'Vợ (Thứ hậu)' },
      { name: 'Trần Anh Tông', relation: 'Con trai' },
      { name: 'Trần Quốc Chẩn', relation: 'Con trai' },
      { name: 'Huyền Trân Công chúa', relation: 'Con gái' }
    ]
  },
  'quang-trung': {
    parents: [
      { name: 'Hồ Phi Phúc', relation: 'Cha (Nội)' },
      { name: 'Nguyễn Thị Đồng', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [
      { name: 'Nguyễn Nhạc', relation: 'Anh trai' },
      { name: 'Nguyễn Lữ', relation: 'Anh em' }
    ],
    family: [
      { name: 'Phạm Thị Liên', relation: 'Vợ (Thái hoàng hậu)' },
      { name: 'Lê Ngọc Hân', relation: 'Vợ (Bắc Cung hoàng hậu)' },
      { name: 'Nguyễn Quang Toản', relation: 'Con trai (Cảnh Thịnh Hoàng đế)' },
      { name: 'Nguyễn Quang Thùy', relation: 'Con trai' }
    ]
  },
  'gia-long': {
    parents: [
      { name: 'Nguyễn Phúc Luân', relation: 'Cha (Nội)' },
      { name: 'Nguyễn Thị Hoàn', relation: 'Mẹ (Ngoại)' }
    ],
    paternalGrandparents: [],
    maternalGrandparents: [],
    siblings: [],
    family: [
      { name: 'Tống Thị Lan', relation: 'Vợ (Thừa Thiên hoàng hậu)' },
      { name: 'Trần Thị Đang', relation: 'Vợ (Thuận Thiên hoàng hậu)' },
      { name: 'Nguyễn Phúc Cảnh', relation: 'Con trai' },
      { name: 'Minh Mạng', relation: 'Con trai (Nguyễn Phúc Đảm)' }
    ]
  }
};

const CharacterFamilyTree = ({
  character,
  relations: propRelations,
  isAdminPreview = false,
  isAdminEditMode = false,
  onAddRelation,
  onRemoveRelation
}) => {
  const navigate = useNavigate();
  const [allCharacters, setAllCharacters] = useState([]);
  const [relations, setRelations] = useState({ parents: [], siblings: [], family: [] });
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState(0); // Trigger to reload from localStorage

  // States for interactive relation adding
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetCategory, setTargetCategory] = useState(''); // 'parents' | 'siblings' | 'spouse' | 'children' | 'child_spouse' | 'grandparents'
  const [targetChild, setTargetChild] = useState(null); // { id, name } child node when adding their spouse
  const [targetParent, setTargetParent] = useState(null); // { id, name } parent node when adding grandparents
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelativeName, setSelectedRelativeName] = useState('');
  const [relationText, setRelationText] = useState('');
  const [isCustomRelation, setIsCustomRelation] = useState(false);
  const [customRelationText, setCustomRelationText] = useState('');
  const [marriedToChildName, setMarriedToChildName] = useState('');
  const [parentSide, setParentSide] = useState('Nội');
  const [showDropdown, setShowDropdown] = useState(false);

  // Child spouses mapping
  const [childSpousesMap, setChildSpousesMap] = useState({});
  const [grandparentsMap, setGrandparentsMap] = useState({});

  // Load all characters to resolve names to portraits & database IDs
  useEffect(() => {
    const fetchAllCharacters = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.USER_CHARACTERS, { params: { size: 500 } });
        const list = res.data?.data?.result || res.data?.data?.content || res.data?.data || [];
        setAllCharacters(list);
      } catch (err) {
        console.error('Failed to load characters for family tree mapping:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCharacters();
  }, []);

  // Load relations for the current character
  useEffect(() => {
    if (propRelations) {
      setRelations(propRelations);
      return;
    }
    if (!character) return;

    // 1. Try local storage first (admin additions)
    const localData = localStorage.getItem(`character_relations_${character.id}`);
    if (localData) {
      try {
        setRelations(JSON.parse(localData));
        return;
      } catch (e) {
        console.error('Error parsing local relations:', e);
      }
    }

    // 2. Try mock historical relations by slug or normalized name
    const mockKey = character.slug || normalizeKey(character.name);
    const mockMatch = HISTORICAL_MOCK_RELATIONS[mockKey] || HISTORICAL_MOCK_RELATIONS[normalizeKey(character.name)];
    if (mockMatch) {
      setRelations(mockMatch);
      return;
    }

    // 3. Fallback to empty relations if none found
    setRelations({ parents: [], siblings: [], family: [] });
  }, [character, propRelations, trigger]);

  // Helper to find a character's metadata by name in the systems database
  const resolveCharacterInfo = useCallback((name) => {
    const targetNorm = normalizeKey(name);
    const match = allCharacters.find(
      c => normalizeKey(c.name) === targetNorm
    );
    if (match) {
      return {
        id: match.id,
        slug: match.slug,
        portrait: match.image || match.portrait || IMAGES.DEFAULT_AVATAR,
        years: match.years || (match.birthDate ? `${new Date(match.birthDate).getFullYear()} - ${match.deathDate ? new Date(match.deathDate).getFullYear() : '?'}` : ''),
        clickable: true
      };
    }
    return {
      portrait: IMAGES.DEFAULT_AVATAR,
      years: 'Lịch sử',
      clickable: false
    };
  }, [allCharacters]);

  // Load child spouses dynamically
  useEffect(() => {
    if (allCharacters.length === 0 || !relations.family) return;

    const spouseMap = {};
    const resolvedChildren = relations.family.filter(f =>
      !f.relation?.toLowerCase().includes('vợ') &&
      !f.relation?.toLowerCase().includes('chồng') &&
      !f.relation?.toLowerCase().includes('phu nhân') &&
      !f.relation?.toLowerCase().includes('thiếp')
    );

    resolvedChildren.forEach(c => {
      const info = resolveCharacterInfo(c.name);
      if (info.clickable && info.id) {
        // Try local storage first
        const localData = localStorage.getItem(`character_relations_${info.id}`);
        let rels = null;
        if (localData) {
          try {
            rels = JSON.parse(localData);
          } catch (e) { }
        }
        if (!rels) {
          // Try mock relations
          const mockKey = info.slug || normalizeKey(c.name);
          rels = HISTORICAL_MOCK_RELATIONS[mockKey] || HISTORICAL_MOCK_RELATIONS[normalizeKey(c.name)];
        }

        if (rels && rels.family) {
          const spouse = rels.family.find(f =>
            f.relation?.toLowerCase().includes('vợ') ||
            f.relation?.toLowerCase().includes('chồng') ||
            f.relation?.toLowerCase().includes('phu nhân') ||
            f.relation?.toLowerCase().includes('thiếp')
          );
          if (spouse) {
            spouseMap[info.id] = {
              ...spouse,
              info: resolveCharacterInfo(spouse.name)
            };
          }
        }
      }
    });

    setChildSpousesMap(spouseMap);
  }, [allCharacters, relations, resolveCharacterInfo, trigger]);

  // Load grandparents dynamically
  useEffect(() => {
    if (allCharacters.length === 0 || parentNodes.length === 0) return;

    const gpMap = {};
    parentNodes.forEach(p => {
      if (p.info.clickable && p.info.id) {
        // Try local storage first
        const localData = localStorage.getItem(`character_relations_${p.info.id}`);
        let rels = null;
        if (localData) {
          try {
            rels = JSON.parse(localData);
          } catch (e) { }
        }
        if (!rels) {
          // Try mock relations
          const mockKey = p.info.slug || normalizeKey(p.name);
          rels = HISTORICAL_MOCK_RELATIONS[mockKey] || HISTORICAL_MOCK_RELATIONS[normalizeKey(p.name)];
        }

        if (rels && rels.parents) {
          gpMap[p.info.id] = rels.parents.map(gp => ({
            ...gp,
            info: resolveCharacterInfo(gp.name)
          }));
        }
      }
    });

    setGrandparentsMap(gpMap);
  }, [allCharacters, relations, resolveCharacterInfo, trigger]);

  const handleNodeClick = (info, name) => {
    if (isAdminPreview || isAdminEditMode) return; // Disable navigation in admin panel
    if (info.clickable && info.id) {
      navigate(`/characters/${info.id}`);
    }
  };

  const openAddRelation = (category) => {
    setTargetCategory(category);
    setTargetChild(null);
    setSearchQuery('');
    setSelectedRelativeName('');
    let defRelation = '';
    if (category === 'parents') defRelation = 'Cha';
    if (category === 'siblings') defRelation = 'Anh trai';
    if (category === 'spouse') defRelation = 'Vợ';
    if (category === 'children') defRelation = 'Con trai';
    setRelationText(defRelation);
    setIsCustomRelation(false);
    setCustomRelationText('');
    setParentSide(defRelation === 'Cha' ? 'Nội' : 'Ngoại');

    // Resolve existing children nodes for dâu/rể matching
    const resolvedChildren = (relations.family || []).filter(f =>
      !f.relation?.toLowerCase().includes('vợ') &&
      !f.relation?.toLowerCase().includes('chồng') &&
      !f.relation?.toLowerCase().includes('phu nhân') &&
      !f.relation?.toLowerCase().includes('thiếp') &&
      !f.relation?.toLowerCase().includes('con dâu') &&
      !f.relation?.toLowerCase().includes('con rể')
    );
    setMarriedToChildName(resolvedChildren[0]?.name || '');

    setShowAddModal(true);
    setShowDropdown(false);
  };

  const openAddChildSpouse = (childCharInfo) => {
    setTargetCategory('child_spouse');
    setTargetChild(childCharInfo);
    setSearchQuery('');
    setSelectedRelativeName('');
    setRelationText('Vợ');
    setIsCustomRelation(false);
    setCustomRelationText('');
    setShowAddModal(true);
    setShowDropdown(false);
  };

  const openAddGrandparent = (category, parentCharInfo) => {
    setTargetCategory(category);
    setTargetParent(parentCharInfo);
    setSearchQuery('');
    setSelectedRelativeName('');
    setRelationText('Cha');
    setIsCustomRelation(false);
    setCustomRelationText('');
    setShowAddModal(true);
    setShowDropdown(false);
  };

  const handleSelectCharacter = (name) => {
    setSelectedRelativeName(name);
    setSearchQuery(name);
    setShowDropdown(false);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const finalName = selectedRelativeName || searchQuery.trim();
    if (!finalName) {
      toast.error('Vui lòng chọn hoặc nhập tên nhân vật.');
      return;
    }

    let finalRelation = isCustomRelation ? customRelationText.trim() : relationText.trim();
    if (targetCategory === 'parents' && !isCustomRelation) {
      if (['Cha', 'Mẹ', 'Cha nuôi', 'Mẹ kế'].includes(relationText)) {
        finalRelation = `${relationText} (${parentSide === 'Nội' ? 'Nội' : 'Ngoại'})`;
      }
    } else if ((relationText === 'Con dâu' || relationText === 'Con rể') && marriedToChildName && !isCustomRelation) {
      const spTitle = relationText === 'Con dâu' ? 'Vợ' : 'Chồng';
      finalRelation = `${relationText} (${spTitle} của ${marriedToChildName})`;
    }

    if (!finalRelation) {
      toast.error('Vui lòng chọn hoặc nhập quan hệ (vai vế).');
      return;
    }

    if (targetCategory === 'child_spouse' && targetChild) {
      // Save directly to the child's own relations
      const childId = targetChild.id;
      const childLocalKey = `character_relations_${childId}`;
      const childData = JSON.parse(localStorage.getItem(childLocalKey) || '{"parents":[],"siblings":[],"family":[]}');

      // Prevent duplicate spouse
      if (!childData.family.some(f => f.name === finalName)) {
        childData.family.push({
          name: finalName,
          relation: finalRelation
        });
      }

      localStorage.setItem(childLocalKey, JSON.stringify(childData));
      setTrigger(prev => prev + 1); // Redraw
    } else if ((targetCategory === 'paternalGrandparents' || targetCategory === 'maternalGrandparents') && onAddRelation) {
      onAddRelation(targetCategory, finalName, finalRelation);
      setTrigger(prev => prev + 1);
    } else if (targetCategory === 'grandparents' && targetParent) {
      // Save directly to the parent's own relations (grandparents of active character)
      const parentId = targetParent.id;
      const parentLocalKey = `character_relations_${parentId}`;
      const parentData = JSON.parse(localStorage.getItem(parentLocalKey) || '{"parents":[],"siblings":[],"family":[]}');

      // Prevent duplicate grandparent
      if (!parentData.parents.some(p => p.name === finalName)) {
        parentData.parents.push({
          name: finalName,
          relation: finalRelation
        });
      }

      localStorage.setItem(parentLocalKey, JSON.stringify(parentData));
      setTrigger(prev => prev + 1); // Redraw
    } else if (onAddRelation) {
      let formCategory = targetCategory;
      if (targetCategory === 'spouse' || targetCategory === 'children') {
        formCategory = 'family';
      }
      onAddRelation(formCategory, finalName, finalRelation);
      setTrigger(prev => prev + 1);
    }

    setShowAddModal(false);
  };

  const handleRemove = (category, name) => {
    if (onRemoveRelation) {
      onRemoveRelation(category, name);
      setTrigger(prev => prev + 1);
    }
  };

  const handleRemoveChildSpouse = (childId, spouseName) => {
    const childLocalKey = `character_relations_${childId}`;
    const childData = JSON.parse(localStorage.getItem(childLocalKey) || '{"parents":[],"siblings":[],"family":[]}');
    childData.family = childData.family.filter(f => f.name !== spouseName);
    localStorage.setItem(childLocalKey, JSON.stringify(childData));
    setTrigger(prev => prev + 1);
  };

  const handleRemoveGrandparent = (parentId, grandparentName) => {
    const parentLocalKey = `character_relations_${parentId}`;
    const parentData = JSON.parse(localStorage.getItem(parentLocalKey) || '{"parents":[],"siblings":[],"family":[]}');
    parentData.parents = parentData.parents.filter(p => p.name !== grandparentName);
    localStorage.setItem(parentLocalKey, JSON.stringify(parentData));
    setTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="py-12 text-center font-body text-sm text-[#6b0f0d]/60 italic animate-pulse">
        Đang dựng cây gia phả hoàng tộc...
      </div>
    );
  }

  // Resolve node data
  const parentNodes = (relations.parents || []).map(p => ({
    ...p,
    info: resolveCharacterInfo(p.name)
  }));
  const siblingNodes = (relations.siblings || []).map(s => ({
    ...s,
    info: resolveCharacterInfo(s.name)
  }));

  // Separate spouses and children from the 'family' list
  const spouses = (relations.family || []).filter(f =>
    (f.relation?.toLowerCase().includes('vợ') ||
      f.relation?.toLowerCase().includes('chồng') ||
      f.relation?.toLowerCase().includes('phu nhân') ||
      f.relation?.toLowerCase().includes('thiếp')) &&
    !f.relation?.toLowerCase().includes('con dâu') &&
    !f.relation?.toLowerCase().includes('con rể')
  ).map(s => ({
    ...s,
    info: resolveCharacterInfo(s.name)
  }));

  const childSpouses = (relations.family || []).filter(f =>
    f.relation?.toLowerCase().includes('con dâu') ||
    f.relation?.toLowerCase().includes('con rể')
  );

  const childrenNodes = (relations.family || []).filter(f =>
    !spouses.some(s => s.name === f.name) &&
    !childSpouses.some(cs => cs.name === f.name)
  ).map(c => ({
    ...c,
    info: resolveCharacterInfo(c.name)
  }));

  // Pair children with their spouses (explicitly added childSpouses, or dynamically loaded childSpousesMap)
  const childrenWithSpouses = [];
  const usedChildSpouseNames = new Set();

  childrenNodes.forEach(c => {
    let matchedSpouse = null;
    const isDaughter = c.relation?.toLowerCase().includes('gái');

    // 1. Try to find matched spouse from parent's explicit relations by checking name mention
    // e.g. "Con dâu (Vợ của Lê Thái Tông)" matches "Lê Thái Tông"
    const nameMatchedSpouse = childSpouses.find(cs =>
      cs.relation?.toLowerCase().includes(c.name?.toLowerCase().trim()) &&
      !usedChildSpouseNames.has(cs.name)
    );

    if (nameMatchedSpouse) {
      matchedSpouse = {
        name: nameMatchedSpouse.name,
        relation: nameMatchedSpouse.relation,
        info: resolveCharacterInfo(nameMatchedSpouse.name),
        isExplicit: true
      };
      usedChildSpouseNames.add(nameMatchedSpouse.name);
    } else {
      // 2. Fallback to sequential matching if no name was mentioned
      if (isDaughter) {
        const spouseObj = childSpouses.find(cs =>
          cs.relation?.toLowerCase().includes('con rể') &&
          !usedChildSpouseNames.has(cs.name)
        );
        if (spouseObj) {
          matchedSpouse = {
            name: spouseObj.name,
            relation: spouseObj.relation,
            info: resolveCharacterInfo(spouseObj.name),
            isExplicit: true
          };
          usedChildSpouseNames.add(spouseObj.name);
        }
      } else {
        const spouseObj = childSpouses.find(cs =>
          cs.relation?.toLowerCase().includes('con dâu') &&
          !usedChildSpouseNames.has(cs.name)
        );
        if (spouseObj) {
          matchedSpouse = {
            name: spouseObj.name,
            relation: spouseObj.relation,
            info: resolveCharacterInfo(spouseObj.name),
            isExplicit: true
          };
          usedChildSpouseNames.add(spouseObj.name);
        }
      }
    }

    // 3. Fallback to child's own database character relations
    if (!matchedSpouse && c.info.id) {
      const dynamicSpouse = childSpousesMap[c.info.id];
      if (dynamicSpouse) {
        matchedSpouse = {
          name: dynamicSpouse.name,
          relation: dynamicSpouse.relation,
          info: dynamicSpouse.info,
          isExplicit: false
        };
      }
    }

    childrenWithSpouses.push({
      child: c,
      spouse: matchedSpouse
    });
  });

  // Resolve active character details
  const activePortrait = character.portrait || character.avatar || IMAGES.DEFAULT_AVATAR;
  const activeYears = character.years || (character.birthYear ? `${character.birthYear} - ${character.deathYear || '?'}` : '');

  // Filter available relative choices
  const filteredChoices = allCharacters.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
    c.name?.toLowerCase().trim() !== character.name?.toLowerCase().trim() &&
    (!targetChild || c.name?.toLowerCase().trim() !== targetChild.name?.toLowerCase().trim())
  );

  return (
    <div className="w-full bg-[#fffdf8]/85 border border-[#d99b4a]/40 shadow-xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm select-none">
      <div className="absolute inset-0 dong-son-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>

      <h3 className="font-headline text-3xl text-[#6b0f0d] font-bold text-center mb-16 tracking-tight flex items-center justify-center gap-3">
        <span className="material-symbols-outlined">family_history</span> {(isAdminPreview || isAdminEditMode) ? 'Xem Trước Cây Gia Phả' : 'Gia Phả Hoàng Tộc'}
      </h3>

      <div className="flex flex-col items-center relative w-full">

        {/* Tier 1: Parents (Thế hệ trước) */}
        {(parentNodes.length > 0 || isAdminEditMode) && (
          <div className="flex flex-col items-center w-full relative z-10 mb-8">
            <div className="flex justify-center items-end gap-12 md:gap-16">
              {parentNodes.map((p, idx) => {
                const parentId = p.info.id;
                const explicitGP = idx === 0
                  ? (relations.paternalGrandparents || [])
                  : (relations.maternalGrandparents || []);

                let resolvedGP = explicitGP.map(gp => ({
                  ...gp,
                  info: resolveCharacterInfo(gp.name),
                  isExplicit: true
                }));

                if (resolvedGP.length === 0 && parentId) {
                  const fallbackGP = grandparentsMap[parentId] || [];
                  resolvedGP = fallbackGP.map(gp => ({
                    ...gp,
                    isExplicit: false
                  }));
                }

                return (
                  <div key={idx} className="flex flex-col items-center relative group">
                    {/* Tier 0: Grandparents (Ông/Bà) */}
                    {(resolvedGP.length > 0 || isAdminEditMode) && (
                      <div className="flex flex-col items-center mb-3 scale-90 md:scale-95 transition-all">
                        <div className="flex items-center gap-3 bg-[#fffdf8]/60 p-2 border border-[#d99b4a]/25 rounded-2xl shadow-sm relative min-h-[50px] min-w-[60px] justify-center">
                          {resolvedGP.map((gp, gpIdx) => {
                            const isPaternal = p.relation?.toLowerCase().includes('nội') || p.relation?.toLowerCase().includes('cha');
                            const gpLabel = gp.relation?.toLowerCase().includes('cha')
                              ? (isPaternal ? 'Ông nội' : 'Ông ngoại')
                              : gp.relation?.toLowerCase().includes('mẹ')
                                ? (isPaternal ? 'Bà nội' : 'Bà ngoại')
                                : (isPaternal ? 'Ông/Bà nội' : 'Ông/Bà ngoại');

                            return (
                              <div key={gpIdx} className="flex flex-col items-center relative">
                                <div className="relative">
                                  <div
                                    onClick={() => handleNodeClick(gp.info, gp.name)}
                                    className={`w-12 h-12 rounded-full overflow-hidden border-2 border-[#d99b4a]/50 shadow-sm ${gp.info.clickable && !isAdminPreview && !isAdminEditMode ? 'hover:border-amber-600 cursor-pointer hover:scale-105 transition-all' : 'cursor-default opacity-90'}`}
                                  >
                                    <img src={gp.info.portrait} className="w-full h-full object-cover" alt={gp.name} />
                                  </div>
                                  {isAdminEditMode && (
                                    <button
                                      onClick={() => {
                                        if (gp.isExplicit) {
                                          handleRemove(idx === 0 ? 'paternalGrandparents' : 'maternalGrandparents', gp.name);
                                        } else {
                                          handleRemoveGrandparent(parentId, gp.name);
                                        }
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-sm cursor-pointer z-20"
                                    >
                                      <span className="material-symbols-outlined text-[9px]">close</span>
                                    </button>
                                  )}
                                </div>
                                <span className="font-headline font-bold text-[9px] text-[#2b0504] mt-1 text-center whitespace-nowrap">{gp.name}</span>
                                <span className="text-[7px] uppercase font-bold tracking-wider text-[#6b0f0d]/60 px-1 bg-[#6b0f0d]/5 rounded-full mt-0.5">{gpLabel}</span>
                              </div>
                            );
                          })}

                          {/* Add Grandparent Button */}
                          {isAdminEditMode && resolvedGP.length < 2 && (
                            <div
                              onClick={() => openAddGrandparent(idx === 0 ? 'paternalGrandparents' : 'maternalGrandparents', { id: p.info.id, name: p.name })}
                              className="w-10 h-10 rounded-full border-2 border-dashed border-[#d99b4a]/40 bg-white/40 hover:bg-white hover:border-[#d99b4a] flex flex-col items-center justify-center text-[#d99b4a] cursor-pointer transition-all hover:scale-105"
                              title={`Thêm phụ huynh cho ${p.name}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">add</span>
                              <span className="text-[7px] font-bold">Nội/Ngoại</span>
                            </div>
                          )}
                        </div>
                        {/* Connector stem down to parent */}
                        <div className="w-[1px] h-3 bg-[#d99b4a]/50 border-r border-dashed border-[#d99b4a]/40"></div>
                      </div>
                    )}

                    {/* Parent Card */}
                    <div className="relative">
                      <div
                        onClick={() => handleNodeClick(p.info, p.name)}
                        className={`w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 shadow-md transition-all duration-300 ${p.info.clickable && !isAdminPreview && !isAdminEditMode ? 'border-[#d99b4a] hover:border-amber-600 hover:scale-105 cursor-pointer' : 'border-[#d99b4a]/60 cursor-default opacity-85'}`}
                      >
                        <img src={p.info.portrait} className="w-full h-full object-cover" alt={p.name} />
                      </div>
                      {/* Delete button for Admin Edit Mode */}
                      {isAdminEditMode && (
                        <button
                          onClick={() => handleRemove('parents', p.name)}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-md border border-white z-20 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      )}
                    </div>
                    <span className="font-headline font-bold text-sm text-[#2b0504] mt-3 text-center">{p.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b0f0d]/60 mt-1 px-2.5 py-0.5 bg-[#6b0f0d]/5 rounded-full">{p.relation || 'Cha/Mẹ'}</span>
                  </div>
                );
              })}

              {/* Plus Card for Parents */}
              {isAdminEditMode && parentNodes.length < 2 && (
                <div
                  onClick={() => openAddRelation('parents')}
                  className="flex flex-col items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full border-3 border-dashed border-[#d99b4a]/40 bg-white/40 hover:bg-white hover:border-[#d99b4a] hover:scale-105 transition-all cursor-pointer text-[#d99b4a] self-end mb-6"
                >
                  <span className="material-symbols-outlined text-2xl">add</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-1 text-center">Thêm Cha/Mẹ</span>
                </div>
              )}
            </div>

            {/* Tree Branch SVG from Parents down to Subject */}
            <div className="w-full h-10 flex justify-center relative">
              <svg className="absolute top-0 w-64 h-10" viewBox="0 0 256 40" fill="none">
                {parentNodes.length > 1 ? (
                  <>
                    <path d="M 64,0 L 64,15 C 64,25 192,25 192,15 L 192,0" stroke="#d99b4a" strokeWidth="2" strokeDasharray="3 3" />
                    <path d="M 128,20 L 128,40" stroke="#d99b4a" strokeWidth="2" />
                  </>
                ) : parentNodes.length === 1 ? (
                  <path d="M 128,0 L 128,40" stroke="#d99b4a" strokeWidth="2" strokeDasharray="3 3" />
                ) : null}
              </svg>
              {parentNodes.length > 1 && (
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 bg-[#fffdf8] px-1">
                  <span className="material-symbols-outlined text-[#d99b4a] text-xs">favorite</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tier 2: Siblings, Subject & Spouse */}
        <div className="flex flex-col md:flex-row items-center justify-center w-full relative z-10 my-4">

          {/* Left Column: Sibling Section */}
          {(siblingNodes.length > 0 || isAdminEditMode) ? (
            <div className="w-full md:flex-1 flex flex-row md:flex-col gap-4 items-center justify-center md:justify-end md:pr-10 md:border-r border-[#d99b4a]/20 pb-6 md:pb-0 z-20">
              <span className="font-body text-[10px] font-bold text-[#6b0f0d]/60 uppercase tracking-widest text-center writing-mode-vertical">Anh chi em</span>
              <div className="flex flex-wrap md:flex-col justify-center items-center gap-4">
                {siblingNodes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#fffdf8]/60 p-2 rounded-lg border border-[#d99b4a]/10 relative group">
                    <div
                      onClick={() => handleNodeClick(s.info, s.name)}
                      className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm ${s.info.clickable && !isAdminPreview && !isAdminEditMode ? 'border-[#d99b4a]/60 hover:border-amber-600 cursor-pointer' : 'border-[#d99b4a]/30 cursor-default'}`}
                    >
                      <img src={s.info.portrait} className="w-full h-full object-cover" alt={s.name} />
                    </div>
                    <div className="text-left pr-4">
                      <p className="font-headline font-bold text-xs text-[#2b0504]">{s.name}</p>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-[#6b0f0d]/70 mt-0.5">{s.relation || 'Anh em'}</p>
                    </div>

                    {/* Delete Sibling Button */}
                    {isAdminEditMode && (
                      <button
                        onClick={() => handleRemove('siblings', s.name)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-sm cursor-pointer z-20"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Sibling Button */}
                {isAdminEditMode && (
                  <div
                    onClick={() => openAddRelation('siblings')}
                    className="flex items-center justify-center gap-2 bg-white/40 hover:bg-white border border-dashed border-[#d99b4a]/40 p-2 w-32 rounded-lg hover:border-[#d99b4a] hover:scale-105 transition-all cursor-pointer text-[#d99b4a]"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider">Thêm Anh Em</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:block md:flex-1" />
          )}

          {/* Center Column: Subject and Spouse */}
          <div className="flex-none flex justify-center px-6 md:px-12 py-4 md:py-0">
            <div className="flex items-center gap-8 md:gap-12">
              {/* Subject Node (Tâm điểm gia phả) */}
              <div className="flex flex-col items-center transform scale-110 relative z-20">
                <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#d99b4a] via-amber-200 to-[#d99b4a] shadow-xl">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white">
                    <img src={activePortrait} className="w-full h-full object-cover" alt={character.name} />
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#6b0f0d] text-[#ffe7b0] border border-[#d99b4a]/60 font-body text-[9px] font-bold uppercase tracking-[0.2em] px-3.5 py-0.5 whitespace-nowrap shadow-md">
                    Bản Thân
                  </div>
                </div>
                <span className="font-headline font-bold text-base text-[#6b0f0d] mt-5 text-center drop-shadow-sm">{character.name}</span>
                <span className="text-[10px] text-[#2b1a16]/60 font-bold mt-0.5">{activeYears || 'Chủ thể'}</span>
              </div>

              {/* Marriage Connection link (===) */}
              {(spouses.length > 0 || isAdminEditMode) && (
                <div className="flex items-center justify-center relative">
                  <div className="w-8 h-[2px] border-b-2 border-dashed border-[#d99b4a]/60"></div>
                  <span className="material-symbols-outlined text-[#d99b4a]/80 text-lg mx-1 select-none">favorite</span>
                  <div className="w-8 h-[2px] border-b-2 border-dashed border-[#d99b4a]/60"></div>
                </div>
              )}

              {/* Spouses List */}
              <div className="flex flex-col gap-4">
                {spouses.map((sp, idx) => (
                  <div key={idx} className="flex flex-col items-center relative group">
                    <div className="relative">
                      <div
                        onClick={() => handleNodeClick(sp.info, sp.name)}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 shadow-md transition-all duration-300 ${sp.info.clickable && !isAdminPreview && !isAdminEditMode ? 'border-[#d99b4a]/80 hover:border-amber-600 hover:scale-105 cursor-pointer' : 'border-[#d99b4a]/40 cursor-default'}`}
                      >
                        <img src={sp.info.portrait} className="w-full h-full object-cover" alt={sp.name} />
                      </div>
                      {/* Delete Spouse Button */}
                      {isAdminEditMode && (
                        <button
                          onClick={() => handleRemove('family', sp.name)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-sm cursor-pointer z-20"
                        >
                          <span className="material-symbols-outlined text-[11px]">close</span>
                        </button>
                      )}
                    </div>
                    <span className="font-headline font-bold text-xs text-[#2b0504] mt-2.5 text-center">{sp.name}</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-[#6b0f0d]/70 mt-0.5 px-2 bg-[#d99b4a]/10 rounded-full">{sp.relation || 'Phu nhân'}</span>
                  </div>
                ))}

                {/* Add Spouse Button */}
                {isAdminEditMode && spouses.length === 0 && (
                  <div
                    onClick={() => openAddRelation('spouse')}
                    className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-3 border-dashed border-[#d99b4a]/40 bg-white/40 hover:bg-white hover:border-[#d99b4a] hover:scale-105 transition-all cursor-pointer text-[#d99b4a]"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider mt-1 text-center">Thêm Vợ/Chồng</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Balance Spacer */}
          <div className="hidden md:block md:flex-1" />

        </div>

        {/* Tier 3: Children (Thế hệ sau & Người kết hôn của con) */}
        {(childrenNodes.length > 0 || isAdminEditMode) && (
          <div className="flex flex-col items-center w-full relative z-10 mt-6">
            {/* Tree Branch SVG from Subject down to Children */}
            <div className="w-full h-10 flex justify-center relative">
              <svg className="absolute top-0 w-64 h-10" viewBox="0 0 256 40" fill="none">
                <path d="M 128,0 L 128,15" stroke="#d99b4a" strokeWidth="2" />
                {(childrenNodes.length > 0 || (childrenNodes.length === 0 && isAdminEditMode)) && (
                  <>
                    <path d="M 40,15 L 216,15" stroke="#d99b4a" strokeWidth="2" />
                    {/* Render branch downward stems */}
                    {childrenNodes.map((_, i) => {
                      const x = 40 + (176 / Math.max(1, childrenNodes.length + (isAdminEditMode ? 0 : -1))) * i;
                      return (
                        <path key={i} d={`M ${x},15 L ${x},40`} stroke="#d99b4a" strokeWidth="2" />
                      );
                    })}
                    {/* Extra branch stem for the "+" card */}
                    {isAdminEditMode && (
                      <path d={`M 216,15 L 216,40`} stroke="#d99b4a" strokeWidth="2" />
                    )}
                  </>
                )}
              </svg>
            </div>

            <div className="flex justify-center items-center flex-wrap gap-10 md:gap-12 mt-4">
              {childrenWithSpouses.map(({ child: c, spouse: childSpouse }, idx) => {
                const childId = c.info.id;

                return (
                  <div key={idx} className="flex items-center gap-4 bg-[#fffdf8]/60 p-4 border border-[#d99b4a]/20 rounded-2xl relative shadow-sm">
                    {/* The Child Node */}
                    <div className="flex flex-col items-center relative">
                      <div className="relative">
                        <div
                          onClick={() => handleNodeClick(c.info, c.name)}
                          className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 shadow-md transition-all duration-300 ${c.info.clickable && !isAdminPreview && !isAdminEditMode ? 'border-[#d99b4a] hover:border-amber-600 hover:scale-105 cursor-pointer' : 'border-[#d99b4a]/60 cursor-default opacity-85'}`}
                        >
                          <img src={c.info.portrait} className="w-full h-full object-cover" alt={c.name} />
                        </div>
                        {/* Delete Child Button */}
                        {isAdminEditMode && (
                          <button
                            onClick={() => handleRemove('family', c.name)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-sm cursor-pointer z-20"
                          >
                            <span className="material-symbols-outlined text-[11px]">close</span>
                          </button>
                        )}
                      </div>
                      <span className="font-headline font-bold text-xs text-[#2b0504] mt-2.5 text-center">{c.name}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-[#6b0f0d]/60 mt-0.5 px-2 bg-[#6b0f0d]/5 rounded-full">{c.relation || 'Con'}</span>
                    </div>

                    {/* Marriage connection line for child */}
                    {(childSpouse || (isAdminEditMode && c.info.clickable && c.info.id)) && (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-[1px] border-b border-dashed border-[#d99b4a]/40"></div>
                        <span className="material-symbols-outlined text-[#d99b4a]/75 text-sm mx-0.5">favorite</span>
                        <div className="w-4 h-[1px] border-b border-dashed border-[#d99b4a]/40"></div>
                      </div>
                    )}

                    {/* Child's Spouse Card */}
                    {childSpouse && (
                      <div className="flex flex-col items-center relative">
                        <div className="relative">
                          <div
                            onClick={() => handleNodeClick(childSpouse.info, childSpouse.name)}
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-3 shadow-md transition-all duration-300 ${childSpouse.info.clickable && !isAdminPreview && !isAdminEditMode ? 'border-[#d99b4a]/70 hover:border-amber-600 hover:scale-105 cursor-pointer' : 'border-[#d99b4a]/30 cursor-default'}`}
                          >
                            <img src={childSpouse.info.portrait} className="w-full h-full object-cover" alt={childSpouse.name} />
                          </div>
                          {/* Delete Child's Spouse Button */}
                          {isAdminEditMode && (
                            <button
                              onClick={() => {
                                if (childSpouse.isExplicit) {
                                  handleRemove('family', childSpouse.name);
                                } else {
                                  handleRemoveChildSpouse(childId, childSpouse.name);
                                }
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-800 transition-colors shadow-sm cursor-pointer z-20"
                            >
                              <span className="material-symbols-outlined text-[11px]">close</span>
                            </button>
                          )}
                        </div>
                        <span className="font-headline font-bold text-[11px] text-[#2b0504] mt-2.5 text-center">{childSpouse.name}</span>
                        <span className="text-[8px] uppercase font-bold tracking-wider text-[#6b0f0d]/60 mt-0.5 px-1.5 bg-[#d99b4a]/10 rounded-full">{childSpouse.relation || 'Phu thê'}</span>
                      </div>
                    )}

                    {/* Add Child's Spouse Button */}
                    {isAdminEditMode && !childSpouse && c.info.clickable && c.info.id && (
                      <div
                        onClick={() => openAddChildSpouse({ id: c.info.id, name: c.name })}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-[#d99b4a]/40 bg-white/40 hover:bg-white hover:border-[#d99b4a] flex flex-col items-center justify-center text-[#d99b4a] cursor-pointer transition-all hover:scale-105"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="text-[8px] uppercase font-bold mt-0.5 text-center">Thêm Bạn Đời</span>
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Add Child Button */}
              {isAdminEditMode && (
                <div
                  onClick={() => openAddRelation('children')}
                  className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-3 border-dashed border-[#d99b4a]/40 bg-white/40 hover:bg-white hover:border-[#d99b4a] hover:scale-105 transition-all cursor-pointer text-[#d99b4a]"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                  <span className="text-[9px] uppercase font-bold tracking-wider mt-1 text-center">Thêm Con</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* POPUP MODAL FOR ADDING RELATIONSHIPS */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#fffdf8] border-2 border-[#d99b4a] shadow-2xl rounded-3xl p-6 md:p-8 max-w-md w-full relative dong-son-pattern">
            <h4 className="font-headline text-2xl text-[#6b0f0d] font-bold border-b border-[#d99b4a]/25 pb-3 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined">person_add</span>
              Thêm {targetCategory === 'parents' ? 'Cha/Mẹ' : targetCategory === 'paternalGrandparents' ? `Ông/Bà Nội (Phụ huynh của ${targetParent?.name})` : targetCategory === 'maternalGrandparents' ? `Ông/Bà Ngoại (Phụ huynh của ${targetParent?.name})` : targetCategory === 'grandparents' ? `Phụ huynh của ${targetParent?.name}` : targetCategory === 'siblings' ? 'Anh/Chị/Em' : targetCategory === 'spouse' ? 'Vợ/Chồng' : targetCategory === 'child_spouse' ? `Bạn đời của ${targetChild?.name}` : 'Con cái'}
            </h4>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-left">
              {/* Character selection with autocomplete search */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tìm nhân vật</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedRelativeName('');
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Nhập tên để tìm kiếm..."
                    className="w-full bg-[#fcf9ee] border border-outline-variant/60 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-body"
                  />
                  {showDropdown && searchQuery.trim().length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-[#d99b4a]/20 rounded-xl shadow-lg z-50">
                      {filteredChoices.length > 0 ? (
                        filteredChoices.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectCharacter(c.name)}
                            className="p-3 text-sm hover:bg-amber-50 cursor-pointer font-body border-b border-gray-100 last:border-0"
                          >
                            {c.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-gray-400 italic">Không tìm thấy nhân vật nào. Bạn có thể tự nhập tên ở trên.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship tag/label (e.g. Cha, Mẹ, Vợ, Con trai) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quan hệ (Vai vế)</label>
                <div className="relative">
                  <select
                    value={isCustomRelation ? 'Khác' : relationText}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Khác') {
                        setIsCustomRelation(true);
                      } else {
                        setIsCustomRelation(false);
                        setRelationText(val);
                        // Auto-set parent side based on choice
                        if (val === 'Cha' || val === 'Cha nuôi') {
                          setParentSide('Nội');
                        } else if (val === 'Mẹ' || val === 'Mẹ kế') {
                          setParentSide('Ngoại');
                        }
                      }
                    }}
                    className="w-full bg-[#fcf9ee] border border-outline-variant/60 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-body font-bold appearance-none cursor-pointer"
                  >
                    {(targetCategory === 'parents' || targetCategory === 'grandparents' || targetCategory === 'paternalGrandparents' || targetCategory === 'maternalGrandparents') && (
                      <>
                        <option value="Cha">Cha</option>
                        <option value="Mẹ">Mẹ</option>
                        <option value="Cha nuôi">Cha nuôi</option>
                        <option value="Mẹ kế">Mẹ kế</option>
                        <option value="Ông nội">Ông nội</option>
                        <option value="Bà nội">Bà nội</option>
                        <option value="Ông ngoại">Ông ngoại</option>
                        <option value="Bà ngoại">Bà ngoại</option>
                      </>
                    )}
                    {targetCategory === 'siblings' && (
                      <>
                        <option value="Anh trai">Anh trai</option>
                        <option value="Chị gái">Chị gái</option>
                        <option value="Em trai">Em trai</option>
                        <option value="Em gái">Em gái</option>
                      </>
                    )}
                    {(targetCategory === 'spouse' || targetCategory === 'child_spouse') && (
                      <>
                        <option value="Vợ">Vợ</option>
                        <option value="Chồng">Chồng</option>
                        <option value="Thiếp">Thiếp</option>
                        <option value="Phu nhân">Phu nhân</option>
                      </>
                    )}
                    {targetCategory === 'children' && (
                      <>
                        <option value="Con trai">Con trai</option>
                        <option value="Con gái">Con gái</option>
                        <option value="Con trưởng">Con trưởng</option>
                        <option value="Con thứ">Con thứ</option>
                        <option value="Con út">Con út</option>
                        <option value="Con dâu">Con dâu</option>
                        <option value="Con rể">Con rể</option>
                      </>
                    )}
                    <option value="Khác">Khác (Nhập thủ công)...</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                </div>

                {isCustomRelation && (
                  <input
                    type="text"
                    value={customRelationText}
                    onChange={(e) => setCustomRelationText(e.target.value)}
                    placeholder="Nhập vai vế quan hệ tùy chỉnh..."
                    className="w-full bg-[#fcf9ee] border border-outline-variant/60 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-body font-bold animate-in fade-in slide-in-from-top-1 duration-200"
                  />
                )}

                {/* Parent Side selector (Nội / Ngoại) */}
                {!isCustomRelation && targetCategory === 'parents' && (
                  <div className="space-y-1.5 animate-in fade-in duration-200 mt-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Phân nhánh họ tộc
                    </label>
                    <div className="relative">
                      <select
                        value={parentSide}
                        onChange={(e) => setParentSide(e.target.value)}
                        className="w-full bg-[#fcf9ee] border border-outline-variant/60 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-body font-bold appearance-none cursor-pointer"
                      >
                        <option value="Nội">Bên nội (Họ cha)</option>
                        <option value="Ngoại">Bên ngoại (Họ mẹ)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                )}

                {/* Married to which child option (for Con dâu / Con rể) */}
                {!isCustomRelation && (relationText === 'Con dâu' || relationText === 'Con rể') && childrenNodes.length > 0 && (
                  <div className="space-y-1.5 animate-in fade-in duration-200 mt-2">
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Kết hôn với (Con của nhân vật)
                    </label>
                    <div className="relative">
                      <select
                        value={marriedToChildName}
                        onChange={(e) => setMarriedToChildName(e.target.value)}
                        className="w-full bg-[#fcf9ee] border border-outline-variant/60 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-body font-bold appearance-none cursor-pointer"
                      >
                        {childrenNodes.map((c, i) => (
                          <option key={i} value={c.name}>{c.name} ({c.relation || 'Con'})</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-4 pt-4 border-t border-[#d99b4a]/15 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors font-body cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#6b0f0d] hover:bg-[#2b0504] text-[#ffe7b0] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-md font-body cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CharacterFamilyTree;
